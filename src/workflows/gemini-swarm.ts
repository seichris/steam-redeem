import { z } from "zod";
import { callGeminiStructured } from "@/lib/ai/gemini";

export type SwarmPhase =
  | "scraping_marketing"
  | "promise_extraction"
  | "legal_mapping"
  | "letter_drafting"
  | "filing_packet";

export type EvidenceSource = {
  evidenceId: string;
  url: string;
  title?: string;
  capturedAtIso: string;
  excerpt?: string;
};

export type PromiseFinding = {
  promiseId: string;
  text: string;
  sourceEvidenceId: string;
  sourceUrl: string;
  sourceDateIso?: string;
};

export type LegalFinding = {
  findingId: string;
  jurisdiction: string;
  legalCitation: string;
  analysis: string;
  relatedPromiseIds: string[];
};

export type LetterDraft = {
  subject: string;
  markdown: string;
  evidenceIndex: { evidenceId: string; description: string }[];
};

export type FilingPacket = {
  jurisdiction: string;
  markdownInstructions: string;
  requiredUserActions: string[];
};

export type SwarmState = {
  claimId: string;
  appId: number;
  gameTitle: string;
  jurisdiction: string;
  progress: string[];
  evidence: EvidenceSource[];
  promises: PromiseFinding[];
  legalFindings: LegalFinding[];
  letter: LetterDraft | null;
  filing: FilingPacket | null;
};

const legalFindingsSchema = z.object({
  legalFindings: z.array(
    z.object({
      findingId: z.string(),
      jurisdiction: z.string(),
      legalCitation: z.string(),
      analysis: z.string(),
      relatedPromiseIds: z.array(z.string())
    })
  )
});

const letterSchema = z.object({
  letter: z.object({
    subject: z.string(),
    markdown: z.string(),
    evidenceIndex: z.array(
      z.object({
        evidenceId: z.string(),
        description: z.string()
      })
    )
  })
});

const filingSchema = z.object({
  filing: z.object({
    jurisdiction: z.string(),
    markdownInstructions: z.string(),
    requiredUserActions: z.array(z.string())
  })
});

export function createInitialSwarmState(input: {
  claimId: string;
  appId: number;
  gameTitle: string;
  jurisdiction: string;
}): SwarmState {
  return {
    ...input,
    progress: [],
    evidence: [],
    promises: [],
    legalFindings: [],
    letter: null,
    filing: null
  };
}

export async function runGeminiSwarm(state: SwarmState): Promise<SwarmState> {
  let next = { ...state };

  next = await runScrapingPhase(next);
  next = await runPromisePhase(next);
  next = await runLegalPhase(next);
  next = await runLetterPhase(next);
  next = await runFilingPhase(next);

  return next;
}

async function runScrapingPhase(state: SwarmState): Promise<SwarmState> {
  return {
    ...state,
    progress: state.progress.concat("Scraping 5 years of marketing...")
  };
}

async function runPromisePhase(state: SwarmState): Promise<SwarmState> {
  return {
    ...state,
    progress: state.progress.concat("Extracting concrete promises...")
  };
}

async function runLegalPhase(state: SwarmState): Promise<SwarmState> {
  const response = await callGeminiStructured<z.infer<typeof legalFindingsSchema>>({
    systemInstruction:
      "You map digital-content promise failures to consumer-law citations. Return strict JSON.",
    userPrompt: JSON.stringify({
      jurisdiction: state.jurisdiction,
      promises: state.promises
    }),
    responseMimeType: "application/json"
  });

  const parsed = legalFindingsSchema.parse(response);

  return {
    ...state,
    legalFindings: parsed.legalFindings,
    progress: state.progress.concat("Matching to EU/UK law...")
  };
}

async function runLetterPhase(state: SwarmState): Promise<SwarmState> {
  const response = await callGeminiStructured<z.infer<typeof letterSchema>>({
    systemInstruction:
      "Draft a formal Letter Before Action from provided facts and citations. Return strict JSON.",
    userPrompt: JSON.stringify({
      jurisdiction: state.jurisdiction,
      gameTitle: state.gameTitle,
      promises: state.promises,
      legalFindings: state.legalFindings
    }),
    responseMimeType: "application/json"
  });

  const parsed = letterSchema.parse(response);

  return {
    ...state,
    letter: parsed.letter,
    progress: state.progress.concat("Drafting Letter Before Action...")
  };
}

async function runFilingPhase(state: SwarmState): Promise<SwarmState> {
  const response = await callGeminiStructured<z.infer<typeof filingSchema>>({
    systemInstruction:
      "Generate small-claims filing checklist and user actions. Return strict JSON.",
    userPrompt: JSON.stringify({
      jurisdiction: state.jurisdiction,
      legalFindings: state.legalFindings
    }),
    responseMimeType: "application/json"
  });

  const parsed = filingSchema.parse(response);

  return {
    ...state,
    filing: parsed.filing,
    progress: state.progress.concat("Preparing court filing packet...")
  };
}

