"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFactCheckByChirp = exports.requestFactCheck = void 0;
const client_1 = require("@prisma/client");
const env_1 = __importDefault(require("../config/env"));
const prisma_1 = __importDefault(require("../config/prisma"));
const wikiService_1 = require("./wikiService");
const geminiService_1 = require("./geminiService");
const gemini_1 = require("../lib/llm/gemini");
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
const isLikelyOpinion = (content) => {
    const lower = content.toLowerCase();
    return lower.length < 30 || nonFactualKeywords.some((keyword) => lower.includes(keyword));
};
const normalizeCitations = (citations) => {
    if (!Array.isArray(citations))
        return client_1.Prisma.JsonNull;
    const trimmed = citations
        .filter((url) => typeof url === "string" && url.trim().length > 0)
        .slice(0, 4);
    return trimmed.length > 0 ? trimmed : client_1.Prisma.JsonNull;
};
const hasReputableCitation = (citations) => {
    return citations.some((url) => {
        try {
            const hostname = new URL(url).hostname;
            return reputablePatterns.some((pattern) => pattern.test(hostname));
        }
        catch (error) {
            return false;
        }
    });
};
const downgradeIfNeeded = (result) => {
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
const runDirectFactCheck = async (claim) => {
    const llmResult = await (0, gemini_1.factCheckDirect)({ claim });
    return downgradeIfNeeded(llmResult);
};
const runLegacyFactCheck = async (claim) => {
    const snippets = await (0, wikiService_1.fetchEvidenceFromWikipedia)(claim);
    if (snippets.length === 0) {
        return {
            verdict: "INSUFFICIENT_EVIDENCE",
            confidence: 0.3,
            summary: "No relevant Wikipedia evidence was found for this claim.",
            citations: [],
        };
    }
    const llmResult = await (0, geminiService_1.runFactCheckWithGemini)(claim, snippets);
    return downgradeIfNeeded(llmResult);
};
const processFactCheck = async (factCheckId) => {
    try {
        await prisma_1.default.factCheck.update({
            where: { id: factCheckId },
            data: { status: "RUNNING" },
        });
        const factCheck = await prisma_1.default.factCheck.findUnique({
            where: { id: factCheckId },
            include: { chirp: true },
        });
        if (!factCheck?.chirp) {
            throw new Error("Chirp not found for fact check");
        }
        const claim = factCheck.chirp.content.trim();
        if (isLikelyOpinion(claim)) {
            await prisma_1.default.factCheck.update({
                where: { id: factCheckId },
                data: {
                    status: "DONE",
                    verdict: "NEEDS_CONTEXT",
                    confidence: 0.5,
                    summary: "This statement reads as opinion, humour, or creative expression rather than a factual claim.",
                    citationsJson: client_1.Prisma.JsonNull,
                    checkedAt: new Date(),
                },
            });
            return;
        }
        const mode = env_1.default.FACTCHECK_MODE ?? "direct";
        const result = mode === "legacy"
            ? await runLegacyFactCheck(claim)
            : await runDirectFactCheck(claim);
        await prisma_1.default.factCheck.update({
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
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await prisma_1.default.factCheck.update({
            where: { id: factCheckId },
            data: {
                status: "ERROR",
                summary: message.slice(0, 500),
                citationsJson: client_1.Prisma.JsonNull,
                checkedAt: new Date(),
            },
        });
    }
};
const requestFactCheck = async (chirpId) => {
    const existing = await prisma_1.default.factCheck.findUnique({ where: { chirpId } });
    if (existing) {
        return existing;
    }
    const created = await prisma_1.default.factCheck.create({
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
exports.requestFactCheck = requestFactCheck;
const getFactCheckByChirp = async (chirpId) => prisma_1.default.factCheck.findUnique({ where: { chirpId } });
exports.getFactCheckByChirp = getFactCheckByChirp;
