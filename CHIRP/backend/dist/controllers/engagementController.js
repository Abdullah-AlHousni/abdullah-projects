"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.undoRechirpHandler = exports.rechirpChirpHandler = exports.getCommentsHandler = exports.commentChirpHandler = exports.unlikeChirpHandler = exports.likeChirpHandler = void 0;
const engagementService_1 = require("../services/engagementService");
const likeChirpHandler = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { likeCount } = await (0, engagementService_1.likeChirp)(req.user.id, req.params.chirpId);
        res.json({ likeCount });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.likeChirpHandler = likeChirpHandler;
const unlikeChirpHandler = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { likeCount } = await (0, engagementService_1.unlikeChirp)(req.user.id, req.params.chirpId);
        res.json({ likeCount });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.unlikeChirpHandler = unlikeChirpHandler;
const commentChirpHandler = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const comment = await (0, engagementService_1.commentOnChirp)(req.user.id, req.params.chirpId, req.body);
        res.status(201).json({ comment });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.commentChirpHandler = commentChirpHandler;
const getCommentsHandler = async (req, res) => {
    try {
        const comments = await (0, engagementService_1.getCommentsForChirp)(req.params.chirpId);
        res.json({ comments });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.getCommentsHandler = getCommentsHandler;
const rechirpChirpHandler = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { rechirpCount } = await (0, engagementService_1.rechirpChirp)(req.user.id, req.params.chirpId);
        res.json({ rechirpCount });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.rechirpChirpHandler = rechirpChirpHandler;
const undoRechirpHandler = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { rechirpCount } = await (0, engagementService_1.undoRechirp)(req.user.id, req.params.chirpId);
        res.json({ rechirpCount });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.undoRechirpHandler = undoRechirpHandler;
