"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMediaHandler = void 0;
const mediaService_1 = require("../services/mediaService");
const uploadMediaHandler = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const { url, mediaType } = await (0, mediaService_1.processAndUploadMedia)(req.file);
        res.status(201).json({ url, mediaType });
    }
    catch (error) {
        console.error("Media upload failed", error);
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.uploadMediaHandler = uploadMediaHandler;
exports.default = exports.uploadMediaHandler;
