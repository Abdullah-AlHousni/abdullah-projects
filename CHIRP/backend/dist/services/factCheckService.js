"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFactCheckByChirp = exports.requestFactCheck = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const wikiService_1 = require("./wikiService");
const geminiService_1 = require("./geminiService");
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
const isLikelyOpinion = (content) => {
    const lower = content.toLowerCase();
    return lower.length < 30 || nonFactualKeywords.some((keyword) => lower.includes(keyword));
};
const formatCitations = (citations) => citations.length > 0 ? citations.slice(0, 4) : client_1.Prisma.JsonNull;
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
                    summary: "This statement reads as opinion or humour rather than a factual claim.",
                    citationsJson: client_1.Prisma.JsonNull,
                    checkedAt: new Date(),
                },
            });
            return;
        }
        const snippets = await (0, wikiService_1.fetchEvidenceFromWikipedia)(claim);
        if (snippets.length === 0) {
            await prisma_1.default.factCheck.update({
                where: { id: factCheckId },
                data: {
                    status: "DONE",
                    verdict: "INSUFFICIENT_EVIDENCE",
                    confidence: 0.3,
                    summary: "No relevant Wikipedia evidence was found for this claim.",
                    citationsJson: client_1.Prisma.JsonNull,
                    checkedAt: new Date(),
                },
            });
            return;
        }
        const llmResult = await (0, geminiService_1.runFactCheckWithGemini)(claim, snippets);
        await prisma_1.default.factCheck.update({
            where: { id: factCheckId },
            data: {
                status: "DONE",
                verdict: llmResult.verdict,
                confidence: llmResult.confidence,
                summary: llmResult.summary,
                citationsJson: formatCitations(llmResult.citations),
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
