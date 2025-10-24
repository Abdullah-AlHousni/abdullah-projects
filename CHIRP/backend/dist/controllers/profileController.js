"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileHandler = void 0;
const profileService_1 = require("../services/profileService");
const viewer_1 = require("../utils/viewer");
const getProfileHandler = async (req, res) => {
    try {
        const viewerId = (0, viewer_1.tryGetViewerId)(req.headers.authorization);
        const profile = await (0, profileService_1.getProfileByUsername)(req.params.username, viewerId);
        res.json({ profile });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.getProfileHandler = getProfileHandler;
