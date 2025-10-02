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

const chirpSelect = {
  id: true,
  content: true,
  mediaUrl: true,
  mediaType: true,
  createdAt: true,
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
} as const;

export const createChirp = async (userId: string, input: z.infer<typeof chirpInputSchema>) => {
  const data = chirpInputSchema.parse(input);

  const chirp = await prisma.chirp.create({
    data: {
      content: data.content,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      authorId: userId,
    },
    select: chirpSelect,
  });

  return chirp;
};

export const getFeed = async (limit = 20) => {
  const chirps = await prisma.chirp.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: chirpSelect,
  });

  return chirps;
};

export const getChirpById = async (chirpId: string) => {
  const chirp = await prisma.chirp.findUnique({
    where: { id: chirpId },
    select: {
      ...chirpSelect,
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

  return chirp;
};

export const getUserChirps = async (username: string) => {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      bio: true,
      chirps: {
        orderBy: { createdAt: "desc" },
        select: chirpSelect,
      },
    },
  });

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  return user;
};
