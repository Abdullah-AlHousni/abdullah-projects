"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.factCheckDirect = void 0;
const env_1 = __importDefault(require("../../config/env"));
const genai_1 = require("@google/genai");
// Dynamically resolve an available Gemini model, with optional override via env.
// Strategy:
// 1) Use env.GEMINI_MODEL if provided.
// 2) Try to list models (best-effort) and pick newest "flash" variant.
// 3) Fallback to a prioritized list and probe until one works.
const ai = new genai_1.GoogleGenAI({ apiKey: env_1.default.GEMINI_API_KEY });
const SYSTEM_PROMPT = [
    "You are a careful, evidence-based fact-checking assistant.",
    "Prefer to cite reputable sources (.gov, .edu, Wikipedia, major news) when possible.",
    "If you cannot find an exact source but the fact is widely established common knowledge, you may still use \"VERIFIED\" or \"DISPUTED\" with lower confidence (≤ 0.6).",
    "Use \"INSUFFICIENT_EVIDENCE\" only when the claim is very obscure or no information is available.",
    "If unsure, return INSUFFICIENT_EVIDENCE or NEEDS_CONTEXT. Output strict JSON only.",
].join(" ");
const FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
];
let cachedModel = null;
const cleanJson = (raw) => raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
const buildPrompt = (claim) => `${SYSTEM_PROMPT}\n\nCLAIM: ${claim}\n\nReturn JSON: { "verdict": one of ["VERIFIED","DISPUTED","NEEDS_CONTEXT","INSUFFICIENT_EVIDENCE"], "confidence": number 0..1, "summary": one or two sentences, "citations": array of 1-4 reputable URLs }`;
// Best-effort: list models and pick the newest "flash" variant
const tryListLatestFlash = async () => {
    try {
        const anyClient = ai;
        if (!anyClient?.models?.list)
            return null;
        const list = await anyClient.models.list();
        const items = list?.models ?? list?.items ?? [];
        const flash = items
            .map((m) => m?.name)
            .filter((n) => typeof n === "string" && /gemini-\d+/i.test(n) && /flash/i.test(n));
        if (flash.length === 0)
            return null;
        // Simple heuristic: sort descending by the first numeric version found
        flash.sort((a, b) => {
            const va = Number((a.match(/gemini-(\d+(?:\.\d+)?)/i) ?? [])[1] ?? 0);
            const vb = Number((b.match(/gemini-(\d+(?:\.\d+)?)/i) ?? [])[1] ?? 0);
            return vb - va;
        });
        return flash[0] ?? null;
    }
    catch {
        return null;
    }
};
const generateWithModel = async (model, prompt, signal) => {
    // Using SDK per Google AI recommendation
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        // @ts-ignore: SDK signal typing may vary by version
        signal,
    });
    const text = response?.text ?? response?.response?.text?.();
    if (!text)
        throw new Error("Gemini returned no text content");
    return String(text);
};
const resolveModelAndGenerate = async (prompt, signal) => {
    const candidates = [];
    if (env_1.default.GEMINI_MODEL) {
        candidates.push(env_1.default.GEMINI_MODEL);
    }
    if (!cachedModel) {
        const latest = await tryListLatestFlash();
        if (latest)
            candidates.push(latest);
        candidates.push(...FALLBACK_MODELS);
    }
    else {
        candidates.push(cachedModel);
    }
    const tried = new Set();
    for (const model of candidates) {
        if (!model || tried.has(model))
            continue;
        tried.add(model);
        try {
            const text = await generateWithModel(model, prompt, signal);
            cachedModel = model; // cache the first working model
            return text;
        }
        catch (err) {
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
const factCheckDirect = async ({ claim }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const prompt = buildPrompt(claim);
        const text = await resolveModelAndGenerate(prompt, controller.signal);
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
