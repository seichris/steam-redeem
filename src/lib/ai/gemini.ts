import { GoogleAuth } from "google-auth-library";

const GOOGLE_AI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const VERTEX_BASE_URL = "https://aiplatform.googleapis.com/v1";

export type GeminiProvider = "google_ai" | "vertex_express" | "vertex";

function getGeminiProvider(): GeminiProvider {
  const raw = (process.env.GEMINI_PROVIDER ?? "google_ai").trim().toLowerCase();
  if (raw === "google_ai" || raw === "vertex_express" || raw === "vertex") {
    return raw;
  }
  throw new Error(
    `Invalid GEMINI_PROVIDER "${raw}". Use one of: google_ai, vertex_express, vertex.`
  );
}

function getGeminiApiKeyOrThrow() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  return apiKey;
}

function getVertexApiKeyOrThrow() {
  return process.env.GEMINI_VERTEX_API_KEY ?? getGeminiApiKeyOrThrow();
}

function getVertexProjectOrThrow() {
  const project =
    process.env.GEMINI_VERTEX_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.GCLOUD_PROJECT;
  if (!project) {
    throw new Error("Missing GEMINI_VERTEX_PROJECT (or GOOGLE_CLOUD_PROJECT/GCLOUD_PROJECT).");
  }
  return project;
}

function getVertexLocation() {
  return process.env.GEMINI_VERTEX_LOCATION ?? "global";
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? "gemini-3-flash";
}

export type GeminiStructuredCall = {
  systemInstruction: string;
  userPrompt: string;
  responseMimeType?: "application/json" | "text/plain";
};

type GeminiRequestConfig = {
  url: string;
  headers: Record<string, string>;
};

function buildRequestBody(input: GeminiStructuredCall) {
  return {
    systemInstruction: {
      parts: [{ text: input.systemInstruction }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: input.userPrompt }]
      }
    ],
    generationConfig: {
      responseMimeType: input.responseMimeType ?? "application/json",
      temperature: 0.2
    }
  };
}

async function getVertexAccessTokenOrThrow() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token) {
    throw new Error("Failed to obtain Vertex access token from GoogleAuth credentials.");
  }
  return token;
}

async function getRequestConfig(model: string): Promise<GeminiRequestConfig> {
  const provider = getGeminiProvider();

  if (provider === "google_ai") {
    return {
      url: `${GOOGLE_AI_BASE_URL}/models/${model}:generateContent`,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": getGeminiApiKeyOrThrow()
      }
    };
  }

  if (provider === "vertex_express") {
    const url = new URL(`${VERTEX_BASE_URL}/publishers/google/models/${model}:generateContent`);
    url.searchParams.set("key", getVertexApiKeyOrThrow());
    return {
      url: url.toString(),
      headers: {
        "content-type": "application/json"
      }
    };
  }

  const project = getVertexProjectOrThrow();
  const location = getVertexLocation();
  const accessToken = await getVertexAccessTokenOrThrow();
  return {
    url: `${VERTEX_BASE_URL}/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent`,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`
    }
  };
}

function getRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function getTextFromResponse(payload: unknown): string | null {
  const root = getRecord(payload);
  const candidates = root?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const firstCandidate = getRecord(candidates[0]);
  const content = getRecord(firstCandidate?.content);
  const parts = content?.parts;
  if (!Array.isArray(parts)) return null;

  for (const part of parts) {
    const partRecord = getRecord(part);
    if (!partRecord) continue;
    if (typeof partRecord.text === "string" && partRecord.text.length > 0) {
      return partRecord.text;
    }
  }
  return null;
}

export async function callGeminiStructured<T = unknown>(
  input: GeminiStructuredCall
): Promise<T> {
  const model = getGeminiModel();
  const request = await getRequestConfig(model);

  const res = await fetch(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(buildRequestBody(input))
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini call failed: ${res.status} ${body.slice(0, 500)}`);
  }

  const json = (await res.json()) as unknown;
  const text = getTextFromResponse(json);
  if (!text) {
    throw new Error("Gemini returned no text output");
  }

  if ((input.responseMimeType ?? "application/json") === "application/json") {
    return JSON.parse(text) as T;
  }
  return text as T;
}
