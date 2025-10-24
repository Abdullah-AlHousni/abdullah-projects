"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommentsForChirp = exports.undoRechirp = exports.rechirpChirp = exports.commentOnChirp = exports.unlikeChirp = exports.likeChirp = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const commentSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).max(280),
});
const ensureChirpExists = async (chirpId) => {
    const chirp = await prisma_1.default.chirp.findUnique({ where: { id: chirpId }, select: { id: true } });
    if (!chirp) {
        throw Object.assign(new Error("Chirp not found"), { status: 404 });
    }
};
const likeChirp = async (userId, chirpId) => {
    await ensureChirpExists(chirpId);
    await prisma_1.default.like.upsert({
        where: {
            userId_chirpId: {
                userId,
                chirpId,
            },
        },
        update: {},
        create: {
            userId,
            chirpId,
        },
    });
    const likeCount = await prisma_1.default.like.count({ where: { chirpId } });
    return { likeCount };
};
exports.likeChirp = likeChirp;
const unlikeChirp = async (userId, chirpId) => {
    await ensureChirpExists(chirpId);
    await prisma_1.default.like.deleteMany({
        where: {
            userId,
            chirpId,
        },
    });
    const likeCount = await prisma_1.default.like.count({ where: { chirpId } });
    return { likeCount };
};
exports.unlikeChirp = unlikeChirp;
const commentOnChirp = async (userId, chirpId, input) => {
    await ensureChirpExists(chirpId);
    const data = commentSchema.parse(input);
    const comment = await prisma_1.default.comment.create({
        data: {
            content: data.content,
            chirpId,
            authorId: userId,
        },
        include: {
            author: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    });
    return comment;
};
exports.commentOnChirp = commentOnChirp;
const rechirpChirp = async (userId, chirpId) => {
    await ensureChirpExists(chirpId);
    await prisma_1.default.retweet.upsert({
        where: {
            userId_chirpId: {
                userId,
                chirpId,
            },
        },
        update: {},
        create: {
            userId,
            chirpId,
        },
    });
    const rechirpCount = await prisma_1.default.retweet.count({ where: { chirpId } });
    return { rechirpCount };
};
exports.rechirpChirp = rechirpChirp;
const undoRechirp = async (userId, chirpId) => {
    await ensureChirpExists(chirpId);
    await prisma_1.default.retweet.deleteMany({
        where: {
            userId,
            chirpId,
        },
    });
    const rechirpCount = await prisma_1.default.retweet.count({ where: { chirpId } });
    return { rechirpCount };
};
exports.undoRechirp = undoRechirp;
const getCommentsForChirp = async (chirpId) => {
    await ensureChirpExists(chirpId);
    return prisma_1.default.comment.findMany({
        where: { chirpId },
        include: {
            author: {
                select: { id: true, username: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getCommentsForChirp = getCommentsForChirp;
