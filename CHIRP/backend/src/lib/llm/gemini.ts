import env from "../../config/env";
import { GoogleGenAI } from "@google/genai";

// Dynamically resolve an available Gemini model, with optional override via env.
// Strategy:
// 1) Use env.GEMINI_MODEL if provided.
// 2) Try to list models (best-effort) and pick newest "flash" variant.
// 3) Fallback to a prioritized list and probe until one works.

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const SYSTEM_PROMPT = [
  "You are a careful, evidence-based fact-checking assistant.",
  "Prefer to cite reputable sources (.gov, .edu, Wikipedia, major news) when possible.",
  "If you cannot find an exact source but the fact is widely established common knowledge, you may still use \"VERIFIED\" or \"DISPUTED\" with lower confidence (≤ 0.6).",
  "Use \"INSUFFICIENT_EVIDENCE\" only when the claim is very obscure or no information is available.",
  "If unsure, return INSUFFICIENT_EVIDENCE or NEEDS_CONTEXT. Output strict JSON only.",
].join(" ");

interface DirectFactCheckInput {
  claim: string;
}

interface DirectFactCheckResult {
  verdict: "VERIFIED" | "DISPUTED" | "NEEDS_CONTEXT" | "INSUFFICIENT_EVIDENCE";
  confidence: number;
  summary: string;
  citations: string[];
}

const FALLBACK_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

let cachedModel: string | null = null;

const cleanJson = (raw: string) => raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

const buildPrompt = (claim: string) =>
  `${SYSTEM_PROMPT}\n\nCLAIM: ${claim}\n\nReturn JSON: { "verdict": one of ["VERIFIED","DISPUTED","NEEDS_CONTEXT","INSUFFICIENT_EVIDENCE"], "confidence": number 0..1, "summary": one or two sentences, "citations": array of 1-4 reputable URLs }`;

// Best-effort: list models and pick the newest "flash" variant
const tryListLatestFlash = async (): Promise<string | null> => {
  try {
    const anyClient = ai as any;
    if (!anyClient?.models?.list) return null;
    const list = await anyClient.models.list();
    const items: Array<{ name?: string }> = list?.models ?? list?.items ?? [];
    const flash = items
      .map((m) => m?.name as string)
      .filter((n) => typeof n === "string" && /gemini-\d+/i.test(n) && /flash/i.test(n));
    if (flash.length === 0) return null;
    // Simple heuristic: sort descending by the first numeric version found
    flash.sort((a, b) => {
      const va = Number((a.match(/gemini-(\d+(?:\.\d+)?)/i) ?? [])[1] ?? 0);
      const vb = Number((b.match(/gemini-(\d+(?:\.\d+)?)/i) ?? [])[1] ?? 0);
      return vb - va;
    });
    return flash[0] ?? null;
  } catch {
    return null;
  }
};

const generateWithModel = async (
  model: string,
  prompt: string,
  signal: AbortSignal,
): Promise<string> => {
  // Using SDK per Google AI recommendation
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    // @ts-ignore: SDK signal typing may vary by version
    signal,
  });
  const text: string | undefined = (response as any)?.text ?? (response as any)?.response?.text?.();
  if (!text) throw new Error("Gemini returned no text content");
  return String(text);
};

const resolveModelAndGenerate = async (prompt: string, signal: AbortSignal): Promise<string> => {
  const candidates: string[] = [];
  if ((env as any).GEMINI_MODEL) {
    candidates.push(((env as any).GEMINI_MODEL as string));
  }
  if (!cachedModel) {
    const latest = await tryListLatestFlash();
    if (latest) candidates.push(latest);
    candidates.push(...FALLBACK_MODELS);
  } else {
    candidates.push(cachedModel);
  }

  const tried = new Set<string>();
  for (const model of candidates) {
    if (!model || tried.has(model)) continue;
    tried.add(model);
    try {
      const text = await generateWithModel(model, prompt, signal);
      cachedModel = model; // cache the first working model
      return text;
    } catch (err) {
      const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
      // If it's a 404/not supported error, try next model; otherwise rethrow
      if (msg.includes("404") || msg.includes("not found") || msg.includes("not supported")) {
        continue;
      }
      throw err;
    }
  }
  throw new Error("No supported Gemini model could be resolved");
};

export const factCheckDirect = async ({ claim }: DirectFactCheckInput): Promise<DirectFactCheckResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const prompt = buildPrompt(claim);
    const text = await resolveModelAndGenerate(prompt, controller.signal);
    return JSON.parse(cleanJson(text)) as DirectFactCheckResult;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Gemini request failed");
  } finally {
    clearTimeout(timeout);
  }
};

export default factCheckDirect;
