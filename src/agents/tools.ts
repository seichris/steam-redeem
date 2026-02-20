import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const webSearchTool = tool(
  async (input: { query: string }) => {
    void input;
    throw new Error("webSearchTool not implemented (wire Serper.dev or Tavily in Phase 3).");
  },
  {
    name: "web_search",
    description: "Search the web for relevant public sources (Serper.dev or Tavily).",
    schema: z.object({
      query: z.string().min(3)
    })
  }
);

export const browseUrlTool = tool(
  async (input: { url: string }) => {
    void input;
    throw new Error("browseUrlTool not implemented (wire Playwright in Phase 3).");
  },
  {
    name: "browse_url",
    description: "Fetch and extract content from a URL (Playwright).",
    schema: z.object({
      url: z.string().url()
    })
  }
);

export const downloadPdfTool = tool(
  async (input: { url: string }) => {
    void input;
    throw new Error("downloadPdfTool not implemented (Phase 3).");
  },
  {
    name: "download_pdf",
    description: "Download a PDF and return extracted text plus a stored artifact reference.",
    schema: z.object({
      url: z.string().url()
    })
  }
);
