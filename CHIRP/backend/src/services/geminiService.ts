import env from "../config/env";
import { GeminiFactCheckResult, WikipediaSnippet } from "../types/factCheck";
import { z } from "zod";

const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

const responseSchema = z.object({
  verdict: z.enum(["VERIFIED", "DISPUTED", "NEEDS_CONTEXT", "INSUFFICIENT_EVIDENCE"]),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  citations: z.array(z.string().url()).min(0).max(4),
});

const buildSourcesSection = (snippets: WikipediaSnippet[]) =>
  snippets
    .map((snippet, index) => `(${index + 1}) ${snippet.title}\nURL: ${snippet.url}\nSNIPPET: ${snippet.snippet}`)
    .join("\n\n");

const buildUserPrompt = (claim: string, snippets: WikipediaSnippet[]) => `CLAIM:\n${claim}\n\nSOURCES:\n${buildSourcesSection(snippets)}\n\nTASK:\nReturn JSON: { "verdict": one of ["VERIFIED","DISPUTED","NEEDS_CONTEXT","INSUFFICIENT_EVIDENCE"], "confidence": number 0..1, "summary": one or two sentences, "citations": array of 1–4 URLs from the provided sources }`;

const requestPayload = (claim: string, snippets: WikipediaSnippet[]) => ({
  systemInstruction: {
    role: "system",
    parts: [
      {
        text: "You are a careful fact-checking assistant. You must ONLY judge the claim using the supplied sources. If sources are insufficient, say so. Always return strict JSON.",
      },
    ],
  },
  contents: [
    {
      role: "user",
      parts: [{ text: buildUserPrompt(claim, snippets) }],
    },
  ],
});

const extractText = (response: any): string | undefined => {
  const textPart = response?.candidates?.[0]?.content?.parts?.find((part: any) => typeof part?.text === "string");
  return textPart?.text;
};

const parseGeminiJson = (raw: string): GeminiFactCheckResult => {
  const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/```$/, "");
  const parsed = JSON.parse(cleaned);
  return responseSchema.parse(parsed);
};

export const runFactCheckWithGemini = async (
  claim: string,
  snippets: WikipediaSnippet[],
): Promise<GeminiFactCheckResult> => {
  const primary = await fetch(GEMINI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload(claim, snippets)),
  });

  if (!primary.ok) {
    throw new Error(`Gemini request failed with status ${primary.status}`);
  }

  const primaryJson = await primary.json();
  const primaryText = extractText(primaryJson);

  try {
    if (!primaryText) {
      throw new Error("Model returned no content");
    }
    return parseGeminiJson(primaryText);
  } catch (error) {
    const fixPrompt = `The previous response did not match the required JSON schema. Fix it and output ONLY valid JSON.`;
    const fallback = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: requestPayload(claim, snippets).systemInstruction,
        contents: [
          {
            role: "user",
            parts: [{ text: buildUserPrompt(claim, snippets) }],
          },
          {
            role: "model",
            parts: [{ text: primaryText ?? "" }],
          },
          {
            role: "user",
            parts: [{ text: fixPrompt }],
          },
        ],
      }),
    });

    if (!fallback.ok) {
      throw new Error(`Gemini retry failed with status ${fallback.status}`);
    }

    const fallbackJson = await fallback.json();
    const fallbackText = extractText(fallbackJson);
    if (!fallbackText) {
      throw new Error("Model returned no content on retry");
    }

    return parseGeminiJson(fallbackText);
  }
};
