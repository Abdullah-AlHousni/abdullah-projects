import { Prisma } from "@prisma/client";
import env from "../config/env";
import prisma from "../config/prisma";
import { fetchEvidenceFromWikipedia } from "./wikiService";
import { runFactCheckWithGemini } from "./geminiService";
import { factCheckDirect } from "../lib/llm/gemini";
import type { FactCheckVerdict } from "../types/factCheck";

const nonFactualKeywords = [
  "lol",
  "haha",
  "i think",
  "in my opinion",
  "feels like",
  "guess",
  "joke",
  "poem",
  "haiku",
  "song",
  "story",
];

const reputablePatterns = [
  /wikipedia\.org/i,
  /\.(gov|mil)(\.|\b)/i,
  /\.(edu)(\.|\b)/i,
  /reuters\.com/i,
  /apnews\.com/i,
  /npr\.org/i,
  /bbc\.co\.uk/i,
  /bbc\.com/i,
  /nytimes\.com/i,
  /washingtonpost\.com/i,
  /wsj\.com/i,
  /bloomberg\.com/i,
  /theguardian\.com/i,
];

const isLikelyOpinion = (content: string) => {
  const lower = content.toLowerCase();
  return lower.length < 30 || nonFactualKeywords.some((keyword) => lower.includes(keyword));
};

const normalizeCitations = (citations: string[] | undefined) => {
  if (!Array.isArray(citations)) return Prisma.JsonNull;
  const trimmed = citations
    .filter((url) => typeof url === "string" && url.trim().length > 0)
    .slice(0, 4);
  return trimmed.length > 0 ? (trimmed as Prisma.JsonArray) : Prisma.JsonNull;
};

const hasReputableCitation = (citations: string[]): boolean => {
  return citations.some((url) => {
    try {
      const hostname = new URL(url).hostname;
      return reputablePatterns.some((pattern) => pattern.test(hostname));
    } catch (error) {
      return false;
    }
  });
};

const downgradeIfNeeded = (
  result: { verdict: FactCheckVerdict; confidence: number; summary: string; citations: string[] },
): { verdict: FactCheckVerdict; confidence: number; summary: string; citations: string[] } => {
  if (result.verdict === "VERIFIED" || result.verdict === "DISPUTED") {
    if (result.citations.length === 0 || !hasReputableCitation(result.citations)) {
      return {
        verdict: "INSUFFICIENT_EVIDENCE",
        confidence: Math.min(result.confidence, 0.4),
        summary: "No reputable sources were provided to support or dispute this claim.",
        citations: [],
      };
    }
  }
  return result;
};

const runDirectFactCheck = async (claim: string) => {
  const llmResult = await factCheckDirect({ claim });
  return downgradeIfNeeded(llmResult);
};

const runLegacyFactCheck = async (claim: string) => {
  const snippets = await fetchEvidenceFromWikipedia(claim);

  if (snippets.length === 0) {
    return {
      verdict: "INSUFFICIENT_EVIDENCE" as FactCheckVerdict,
      confidence: 0.3,
      summary: "No relevant Wikipedia evidence was found for this claim.",
      citations: [],
    };
  }

  const llmResult = await runFactCheckWithGemini(claim, snippets);
  return downgradeIfNeeded(llmResult);
};

const processFactCheck = async (factCheckId: string) => {
  try {
    await prisma.factCheck.update({
      where: { id: factCheckId },
      data: { status: "RUNNING" },
    });

    const factCheck = await prisma.factCheck.findUnique({
      where: { id: factCheckId },
      include: { chirp: true },
    });

    if (!factCheck?.chirp) {
      throw new Error("Chirp not found for fact check");
    }

    const claim = factCheck.chirp.content.trim();

    if (isLikelyOpinion(claim)) {
      await prisma.factCheck.update({
        where: { id: factCheckId },
        data: {
          status: "DONE",
          verdict: "NEEDS_CONTEXT",
          confidence: 0.5,
          summary: "This statement reads as opinion, humour, or creative expression rather than a factual claim.",
          citationsJson: Prisma.JsonNull,
          checkedAt: new Date(),
        },
      });
      return;
    }

    const mode = env.FACTCHECK_MODE ?? "direct";
    const result =
      mode === "legacy"
        ? await runLegacyFactCheck(claim)
        : await runDirectFactCheck(claim);

    await prisma.factCheck.update({
      where: { id: factCheckId },
      data: {
        status: "DONE",
        verdict: result.verdict,
        confidence: result.confidence,
        summary: result.summary,
        citationsJson: normalizeCitations(result.citations),
        checkedAt: new Date(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.factCheck.update({
      where: { id: factCheckId },
      data: {
        status: "ERROR",
        summary: message.slice(0, 500),
        citationsJson: Prisma.JsonNull,
        checkedAt: new Date(),
      },
    });
  }
};

export const requestFactCheck = async (chirpId: string) => {
  const existing = await prisma.factCheck.findUnique({ where: { chirpId } });
  if (existing) {
    return existing;
  }

  const created = await prisma.factCheck.create({
    data: {
      chirpId,
      status: "PENDING",
    },
  });

  setImmediate(() => {
    processFactCheck(created.id).catch((error) => {
      console.error("Fact check processing failed", error);
    });
  });

  return created;
};

export const getFactCheckByChirp = async (chirpId: string) =>
  prisma.factCheck.findUnique({ where: { chirpId } });
