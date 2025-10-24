"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.factCheckDirect = void 0;
const env_1 = __importDefault(require("../../config/env"));
const GEMINI_MODEL = "gemini-1.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${env_1.default.GEMINI_API_KEY}`;
const systemPrompt = "You are a careful, evidence-based fact-checking assistant. Use knowledge you are confident about and never invent citations. If unsure, return INSUFFICIENT_EVIDENCE or NEEDS_CONTEXT. Output strict JSON only.";
const requestBody = (claim) => ({
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
const extractText = (response) => {
    const candidate = response?.candidates?.[0]?.content?.parts?.find((part) => typeof part?.text === "string");
    return candidate?.text?.trim();
};
const cleanJson = (raw) => raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
const factCheckDirect = async ({ claim }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
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
        return JSON.parse(cleanJson(text));
    }
    catch (error) {
        throw new Error(error instanceof Error ? error.message : "Gemini request failed");
    }
    finally {
        clearTimeout(timeout);
    }
};
exports.factCheckDirect = factCheckDirect;
exports.default = exports.factCheckDirect;
