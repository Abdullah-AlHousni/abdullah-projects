import { z } from "zod";
import prisma from "../config/prisma";

const chirpInputSchema = z
  .object({
    content: z.string().min(1).max(280),
    mediaUrl: z.string().url().optional(),
    mediaType: z.enum(["image", "video"]).optional(),
  })
  .refine(
    (data) =>
      (!data.mediaUrl && !data.mediaType) ||
      (Boolean(data.mediaUrl) && Boolean(data.mediaType)),
    {
      message: "mediaType is required when mediaUrl is provided",
      path: ["mediaType"],
    },
  );

const buildChirpInclude = (viewerId?: string) => ({
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

const formatChirp = (chirp: any, viewerId?: string) => {
  const viewerHasLiked = viewerId ? Boolean(chirp?.likes?.length) : false;
  const viewerHasRechirped = viewerId ? Boolean(chirp?.retweets?.length) : false;
  const { likes, retweets, ...rest } = chirp ?? {};

  return {
    ...rest,
    viewerHasLiked,
    viewerHasRechirped,
  };
};

export const createChirp = async (userId: string, input: z.infer<typeof chirpInputSchema>) => {
  const data = chirpInputSchema.parse(input);

  const chirp = await prisma.chirp.create({
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

export const getFeed = async (limit: number, viewerId?: string) => {
  const chirps = await prisma.chirp.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: buildChirpInclude(viewerId),
  });

  return chirps.map((chirp) => formatChirp(chirp, viewerId));
};

export const getChirpById = async (chirpId: string, viewerId?: string) => {
  const chirp = await prisma.chirp.findUnique({
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

export const getUserChirps = async (username: string, viewerId?: string) => {
  const user = await prisma.user.findUnique({
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
