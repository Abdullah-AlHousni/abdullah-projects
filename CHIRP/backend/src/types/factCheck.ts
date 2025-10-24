export type FactCheckStatus = "PENDING" | "RUNNING" | "DONE" | "ERROR";
export type FactCheckVerdict = "VERIFIED" | "DISPUTED" | "NEEDS_CONTEXT" | "INSUFFICIENT_EVIDENCE";

export interface WikipediaSnippet {
  title: string;
  url: string;
  snippet: string;
}

export interface GeminiFactCheckResult {
  verdict: FactCheckVerdict;
  confidence: number;
  summary: string;
  citations: string[];
}
