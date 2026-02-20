const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function getGeminiApiKeyOrThrow() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  return apiKey;
}

export function getGeminiModel() {
  return process.env.GEMINI_MODEL ?? "gemini-1.5-pro";
}

export type GeminiStructuredCall = {
  systemInstruction: string;
  userPrompt: string;
  responseMimeType?: "application/json" | "text/plain";
};

export async function callGeminiStructured<T = unknown>(
  input: GeminiStructuredCall
): Promise<T> {
  const apiKey = getGeminiApiKeyOrThrow();
  const model = getGeminiModel();

  const url = new URL(`${GEMINI_BASE_URL}/models/${model}:generateContent`);
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
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
    })
  });

  if (!res.ok) {
    throw new Error(`Gemini call failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no text output");
  }

  return JSON.parse(text) as T;
}

