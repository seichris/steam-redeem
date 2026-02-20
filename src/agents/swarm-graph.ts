import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { webSearchTool, browseUrlTool, downloadPdfTool } from "@/agents/tools";

export type EvidenceSource = {
  url: string;
  title?: string;
  capturedAtIso: string;
  excerpt?: string;
  evidenceId?: string;
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
  legalTextCitation: string;
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
  pdfArtifactId?: string;
};

const SwarmState = Annotation.Root({
  claimId: Annotation<string>(),
  appId: Annotation<number>(),
  gameTitle: Annotation<string>({
    value: (_current, update) => update,
    default: () => ""
  }),
  jurisdiction: Annotation<string>(),

  progress: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),

  evidence: Annotation<EvidenceSource[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),

  promises: Annotation<PromiseFinding[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),

  legalFindings: Annotation<LegalFinding[]>({
    reducer: (left, right) => left.concat(right),
    default: () => []
  }),

  letter: Annotation<LetterDraft | null>({
    value: (_current, update) => update,
    default: () => null
  }),

  filing: Annotation<FilingPacket | null>({
    value: (_current, update) => update,
    default: () => null
  })
});

async function scraperAgent(_state: typeof SwarmState.State) {
  void _state;
  const tools = [webSearchTool, browseUrlTool, downloadPdfTool];
  void tools;

  return {
    progress: [
      "Scraping 5 years of marketing… (Phase 3 will: Steam news, trailers, dev blogs, roadmaps)"
    ]
  };
}

async function legalAnalystAgent(state: typeof SwarmState.State) {
  void state;
  return {
    progress: ["Matching claims to EU/UK law… (Phase 3 will produce paragraph-cited findings)"]
  };
}

async function letterDrafterAgent(state: typeof SwarmState.State) {
  void state;
  return {
    progress: ["Drafting Letter Before Action… (Phase 4 will generate PDF + evidence index)"]
  };
}

async function filingAgent(state: typeof SwarmState.State) {
  void state;
  return {
    progress: ["Preparing court filing packet… (Phase 5 will generate PDFs + instructions)"]
  };
}

export function buildSwarmGraph() {
  return new StateGraph(SwarmState)
    .addNode("scraper_agent", scraperAgent)
    .addNode("legal_analyst_agent", legalAnalystAgent)
    .addNode("letter_drafter_agent", letterDrafterAgent)
    .addNode("filing_agent", filingAgent)
    .addEdge(START, "scraper_agent")
    .addEdge("scraper_agent", "legal_analyst_agent")
    .addEdge("legal_analyst_agent", "letter_drafter_agent")
    .addEdge("letter_drafter_agent", "filing_agent")
    .addEdge("filing_agent", END)
    .compile();
}

export type SwarmGraph = ReturnType<typeof buildSwarmGraph>;
