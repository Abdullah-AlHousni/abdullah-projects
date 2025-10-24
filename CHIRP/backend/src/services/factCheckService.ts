import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { fetchEvidenceFromWikipedia } from "./wikiService";
import { runFactCheckWithGemini } from "./geminiService";
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
];

const isLikelyOpinion = (content: string) => {
  const lower = content.toLowerCase();
  return lower.length < 30 || nonFactualKeywords.some((keyword) => lower.includes(keyword));
};

const formatCitations = (citations: string[]) =>
  citations.length > 0 ? (citations.slice(0, 4) as Prisma.JsonArray) : Prisma.JsonNull;

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
          summary: "This statement reads as opinion or humour rather than a factual claim.",
          citationsJson: Prisma.JsonNull,
          checkedAt: new Date(),
        },
      });
      return;
    }

    const snippets = await fetchEvidenceFromWikipedia(claim);

    if (snippets.length === 0) {
      await prisma.factCheck.update({
        where: { id: factCheckId },
        data: {
          status: "DONE",
          verdict: "INSUFFICIENT_EVIDENCE",
          confidence: 0.3,
          summary: "No relevant Wikipedia evidence was found for this claim.",
          citationsJson: Prisma.JsonNull,
          checkedAt: new Date(),
        },
      });
      return;
    }

    const llmResult = await runFactCheckWithGemini(claim, snippets);

    await prisma.factCheck.update({
      where: { id: factCheckId },
      data: {
        status: "DONE",
        verdict: llmResult.verdict as FactCheckVerdict,
        confidence: llmResult.confidence,
        summary: llmResult.summary,
        citationsJson: formatCitations(llmResult.citations),
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
