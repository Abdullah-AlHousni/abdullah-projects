"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserChirps = exports.getChirpById = exports.getFeed = exports.createChirp = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const chirpInputSchema = zod_1.z
    .object({
    content: zod_1.z.string().min(1).max(280),
    mediaUrl: zod_1.z.string().url().optional(),
    mediaType: zod_1.z.enum(["image", "video"]).optional(),
})
    .refine((data) => (!data.mediaUrl && !data.mediaType) ||
    (Boolean(data.mediaUrl) && Boolean(data.mediaType)), {
    message: "mediaType is required when mediaUrl is provided",
    path: ["mediaType"],
});
const buildChirpInclude = (viewerId) => ({
    author: {
        select: {
            id: true,
            username: true,
            bio: true,
        },
    },
    _count: {
        select: {
            likes: true,
            comments: true,
            retweets: true,
        },
    },
    ...(viewerId
        ? {
            likes: {
                where: { userId: viewerId },
                select: { id: true },
            },
            retweets: {
                where: { userId: viewerId },
                select: { id: true },
            },
        }
        : {}),
});
const formatChirp = (chirp, viewerId) => {
    const viewerHasLiked = viewerId ? Boolean(chirp?.likes?.length) : false;
    const viewerHasRechirped = viewerId ? Boolean(chirp?.retweets?.length) : false;
    const { likes, retweets, ...rest } = chirp ?? {};
    return {
        ...rest,
        viewerHasLiked,
        viewerHasRechirped,
    };
};
const createChirp = async (userId, input) => {
    const data = chirpInputSchema.parse(input);
    const chirp = await prisma_1.default.chirp.create({
        data: {
            content: data.content,
            mediaUrl: data.mediaUrl,
            mediaType: data.mediaType,
            authorId: userId,
        },
        include: buildChirpInclude(userId),
    });
    return formatChirp(chirp, userId);
};
exports.createChirp = createChirp;
const getFeed = async (limit, viewerId) => {
    const chirps = await prisma_1.default.chirp.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
        include: buildChirpInclude(viewerId),
    });
    return chirps.map((chirp) => formatChirp(chirp, viewerId));
};
exports.getFeed = getFeed;
const getChirpById = async (chirpId, viewerId) => {
    const chirp = await prisma_1.default.chirp.findUnique({
        where: { id: chirpId },
        include: {
            ...buildChirpInclude(viewerId),
            comments: {
                include: {
                    author: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
        },
    });
    if (!chirp) {
        throw Object.assign(new Error("Chirp not found"), { status: 404 });
    }
    const formatted = formatChirp(chirp, viewerId);
    return {
        ...formatted,
        comments: chirp.comments,
    };
};
exports.getChirpById = getChirpById;
const getUserChirps = async (username, viewerId) => {
    const user = await prisma_1.default.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            bio: true,
            createdAt: true,
            chirps: {
                orderBy: { createdAt: "desc" },
                include: buildChirpInclude(viewerId),
            },
        },
    });
    if (!user) {
        throw Object.assign(new Error("User not found"), { status: 404 });
    }
    return {
        ...user,
        chirps: user.chirps.map((chirp) => formatChirp(chirp, viewerId)),
    };
};
exports.getUserChirps = getUserChirps;
