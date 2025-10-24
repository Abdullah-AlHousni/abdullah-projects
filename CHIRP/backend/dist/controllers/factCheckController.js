"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFactCheck = exports.triggerFactCheck = void 0;
const factCheckService_1 = require("../services/factCheckService");
const triggerFactCheck = async (req, res) => {
    try {
        const { chirpId } = req.params;
        if (!chirpId) {
            return res.status(400).json({ message: "chirpId is required" });
        }
        const factCheck = await (0, factCheckService_1.requestFactCheck)(chirpId);
        res.status(202).json({ factCheck });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to schedule fact check";
        res.status(500).json({ message });
    }
};
exports.triggerFactCheck = triggerFactCheck;
const fetchFactCheck = async (req, res) => {
    try {
        const { chirpId } = req.params;
        if (!chirpId) {
            return res.status(400).json({ message: "chirpId is required" });
        }
        const factCheck = await (0, factCheckService_1.getFactCheckByChirp)(chirpId);
        if (!factCheck) {
            return res.status(404).json({ message: "Fact check not found" });
        }
        res.json({ factCheck });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unable to fetch fact check";
        res.status(500).json({ message });
    }
};
exports.fetchFactCheck = fetchFactCheck;
