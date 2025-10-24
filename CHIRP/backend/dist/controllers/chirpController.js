"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserChirpsHandler = exports.getChirpHandler = exports.getFeedHandler = exports.createChirpHandler = void 0;
const chirpService_1 = require("../services/chirpService");
const viewer_1 = require("../utils/viewer");
const parseLimit = (limitRaw, defaultValue) => {
    if (typeof limitRaw === "string") {
        const parsed = Number.parseInt(limitRaw, 10);
        return Number.isFinite(parsed) ? parsed : defaultValue;
    }
    if (Array.isArray(limitRaw)) {
        const candidate = limitRaw[0];
        if (typeof candidate === "string") {
            const parsed = Number.parseInt(candidate, 10);
            return Number.isFinite(parsed) ? parsed : defaultValue;
        }
    }
    return defaultValue;
};
const createChirpHandler = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { content, mediaUrl, mediaType } = req.body;
        const chirp = await (0, chirpService_1.createChirp)(req.user.id, {
            content: content ?? "",
            mediaUrl,
            mediaType,
        });
        res.status(201).json({ chirp });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.createChirpHandler = createChirpHandler;
const getFeedHandler = async (req, res) => {
    try {
        const viewerId = (0, viewer_1.tryGetViewerId)(req.headers.authorization);
        const limit = parseLimit(req.query.limit, 20);
        const chirps = await (0, chirpService_1.getFeed)(limit, viewerId);
        res.json({ chirps });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.getFeedHandler = getFeedHandler;
const getChirpHandler = async (req, res) => {
    try {
        const viewerId = (0, viewer_1.tryGetViewerId)(req.headers.authorization);
        const chirp = await (0, chirpService_1.getChirpById)(req.params.chirpId, viewerId);
        res.json({ chirp });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.getChirpHandler = getChirpHandler;
const getUserChirpsHandler = async (req, res) => {
    try {
        const viewerId = (0, viewer_1.tryGetViewerId)(req.headers.authorization);
        const profile = await (0, chirpService_1.getUserChirps)(req.params.username, viewerId);
        res.json({ profile });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.getUserChirpsHandler = getUserChirpsHandler;
