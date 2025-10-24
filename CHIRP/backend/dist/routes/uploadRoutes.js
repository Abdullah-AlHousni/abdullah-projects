"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadController_1 = __importDefault(require("../controllers/uploadController"));
const mediaService_1 = require("../services/mediaService");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB
    },
    fileFilter: (_req, file, cb) => {
        if ((0, mediaService_1.isImage)(file.mimetype) || (0, mediaService_1.isVideo)(file.mimetype)) {
            cb(null, true);
            return;
        }
        cb(Object.assign(new Error("Only image and video uploads are allowed"), { status: 400 }));
    },
});
router.post("/", authMiddleware_1.authenticate, upload.single("file"), uploadController_1.default);
exports.default = router;
