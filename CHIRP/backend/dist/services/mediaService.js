"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processAndUploadMedia = exports.uploadBufferToS3 = exports.isVideo = exports.isImage = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const sharp_1 = __importDefault(require("sharp"));
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const s3_1 = __importDefault(require("../config/s3"));
const env_1 = __importDefault(require("../config/env"));
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
const IMAGE_MIME_PREFIX = "image/";
const VIDEO_MIME_PREFIX = "video/";
const UPLOAD_BASE_PATH = "chirps";
const isImage = (mimetype) => mimetype.startsWith(IMAGE_MIME_PREFIX);
exports.isImage = isImage;
const isVideo = (mimetype) => mimetype.startsWith(VIDEO_MIME_PREFIX);
exports.isVideo = isVideo;
const buildObjectKey = (extension) => {
    const id = (0, node_crypto_1.randomUUID)();
    return `${UPLOAD_BASE_PATH}/${new Date().toISOString()}-${id}.${extension}`;
};
const optimiseImage = async (buffer) => {
    const processed = await (0, sharp_1.default)(buffer)
        .rotate()
        .resize({ width: 1080, withoutEnlargement: true })
        .withMetadata({})
        .webp({ quality: 70 })
        .toBuffer();
    return {
        buffer: processed,
        contentType: "image/webp",
        extension: "webp",
    };
};
const transcodeVideo = async (buffer) => {
    const id = (0, node_crypto_1.randomUUID)();
    const inputPath = (0, node_path_1.join)((0, node_os_1.tmpdir)(), `${id}-input`);
    const outputPath = (0, node_path_1.join)((0, node_os_1.tmpdir)(), `${id}-output.mp4`);
    await node_fs_1.promises.writeFile(inputPath, buffer);
    try {
        await new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(inputPath)
                .outputOptions("-vf", "scale='-2:min(720,ih)'", "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-maxrate", "3000k", "-bufsize", "6000k")
                .output(outputPath)
                .on("end", resolve)
                .on("error", reject)
                .run();
        });
        const processed = await node_fs_1.promises.readFile(outputPath);
        return {
            buffer: processed,
            contentType: "video/mp4",
            extension: "mp4",
        };
    }
    finally {
        await Promise.all([
            node_fs_1.promises.unlink(inputPath).catch(() => undefined),
            node_fs_1.promises.unlink(outputPath).catch(() => undefined),
        ]);
    }
};
const uploadBufferToS3 = async (buffer, contentType, extension) => {
    const Key = buildObjectKey(extension);
    await s3_1.default.send(new client_s3_1.PutObjectCommand({
        Bucket: env_1.default.AWS_BUCKET_NAME,
        Key,
        Body: buffer,
        ContentType: contentType,
    }));
    const baseUrl = `https://${env_1.default.AWS_BUCKET_NAME}.s3.${env_1.default.AWS_REGION}.amazonaws.com`;
    return `${baseUrl}/${Key}`;
};
exports.uploadBufferToS3 = uploadBufferToS3;
const processAndUploadMedia = async (file) => {
    if (!file.mimetype) {
        throw Object.assign(new Error("File mimetype missing"), { status: 400 });
    }
    if ((0, exports.isImage)(file.mimetype)) {
        const { buffer, contentType, extension } = await optimiseImage(file.buffer);
        const url = await (0, exports.uploadBufferToS3)(buffer, contentType, extension);
        return { url, mediaType: "image" };
    }
    if ((0, exports.isVideo)(file.mimetype)) {
        const { buffer, contentType, extension } = await transcodeVideo(file.buffer);
        const url = await (0, exports.uploadBufferToS3)(buffer, contentType, extension);
        return { url, mediaType: "video" };
    }
    throw Object.assign(new Error("Only image and video uploads are supported"), { status: 400 });
};
exports.processAndUploadMedia = processAndUploadMedia;
