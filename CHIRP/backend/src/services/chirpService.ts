import { z } from "zod";
import prisma from "../config/prisma";

const chirpInputSchema = z.object({
  content: z.string().min(1).max(280),
  mediaUrl: z.string().url().optional(),
  mediaType: z.enum(["image", "gif", "video"]).optional(),
});

export const createChirp = async (userId: string, input: z.infer<typeof chirpInputSchema>) => {
  const data = chirpInputSchema.parse(input);

  const chirp = await prisma.chirp.create({
    data: {
      content: data.content,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      authorId: userId,
    },
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
    },
  });

  return chirp;
};

export const getFeed = async (limit = 20) => {
  const chirps = await prisma.chirp.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
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
    },
  });

  return chirps;
};

export const getChirpById = async (chirpId: string) => {
  const chirp = await prisma.chirp.findUnique({
    where: { id: chirpId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          bio: true,
        },
      },
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
      _count: {
        select: {
          likes: true,
          comments: true,
          retweets: true,
        },
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
        include: {
          author: {
            select: {
              id: true,
              username: true,
              bio: true,
            },
          },
          _count: {
            select: { likes: true, comments: true, retweets: true },
          },
        },
      },
    },
  });

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  return user;
};
