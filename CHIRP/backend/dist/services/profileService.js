"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfileByUsername = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const formatProfileChirp = (chirp, viewerId) => {
    const viewerHasLiked = viewerId ? Boolean(chirp?.likes?.length) : false;
    const viewerHasRechirped = viewerId ? Boolean(chirp?.retweets?.length) : false;
    const { likes, retweets, ...rest } = chirp ?? {};
    return {
        ...rest,
        viewerHasLiked,
        viewerHasRechirped,
    };
};
const getProfileByUsername = async (username, viewerId) => {
    const profile = await prisma_1.default.user.findUnique({
        where: { username },
        select: {
            id: true,
            username: true,
            bio: true,
            createdAt: true,
            chirps: {
                orderBy: { createdAt: "desc" },
                include: {
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
                },
            },
        },
    });
    if (!profile) {
        throw Object.assign(new Error("Profile not found"), { status: 404 });
    }
    return {
        ...profile,
        chirps: profile.chirps.map((chirp) => formatProfileChirp(chirp, viewerId)),
    };
};
exports.getProfileByUsername = getProfileByUsername;
