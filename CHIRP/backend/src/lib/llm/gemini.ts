import env from "../../config/env";

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

const systemPrompt = [
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

const requestBody = (claim: string) => ({
  systemInstruction: {
    role: "system",
    parts: [{ text: systemPrompt }],
  },
  contents: [
    {
      role: "user",
      parts: [
        {
          text: `CLAIM: ${claim}\n\nReturn JSON: { "verdict": one of ["VERIFIED","DISPUTED","NEEDS_CONTEXT","INSUFFICIENT_EVIDENCE"], "confidence": number 0..1, "summary": one or two sentences, "citations": array of 1-4 reputable URLs }`,
        },
      ],
    },
  ],
});

const extractText = (response: any): string | undefined => {
  const candidate = response?.candidates?.[0]?.content?.parts?.find((part: any) => typeof part?.text === "string");
  return candidate?.text?.trim();
};

const cleanJson = (raw: string) => raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

export const factCheckDirect = async ({ claim }: DirectFactCheckInput): Promise<DirectFactCheckResult> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody(claim)),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    const json = await response.json();
    const text = extractText(json);
    if (!text) {
      throw new Error("Gemini response missing text content");
    }

    return JSON.parse(cleanJson(text)) as DirectFactCheckResult;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Gemini request failed");
  } finally {
    clearTimeout(timeout);
  }
};

export default factCheckDirect;
