import { z } from "zod";
import prisma from "../config/prisma";

const commentSchema = z.object({
  content: z.string().min(1).max(280),
});

const ensureChirpExists = async (chirpId: string) => {
  const chirp = await prisma.chirp.findUnique({ where: { id: chirpId }, select: { id: true } });
  if (!chirp) {
    throw Object.assign(new Error("Chirp not found"), { status: 404 });
  }
};

export const likeChirp = async (userId: string, chirpId: string) => {
  await ensureChirpExists(chirpId);

  await prisma.like.upsert({
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

  const likeCount = await prisma.like.count({ where: { chirpId } });
  return { likeCount };
};

export const unlikeChirp = async (userId: string, chirpId: string) => {
  await ensureChirpExists(chirpId);

  await prisma.like.deleteMany({
    where: {
      userId,
      chirpId,
    },
  });

  const likeCount = await prisma.like.count({ where: { chirpId } });
  return { likeCount };
};

export const commentOnChirp = async (
  userId: string,
  chirpId: string,
  input: z.infer<typeof commentSchema>,
) => {
  await ensureChirpExists(chirpId);

  const data = commentSchema.parse(input);

  const comment = await prisma.comment.create({
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

export const retweetChirp = async (userId: string, chirpId: string) => {
  await ensureChirpExists(chirpId);

  await prisma.retweet.upsert({
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

  const retweetCount = await prisma.retweet.count({ where: { chirpId } });
  return { retweetCount };
};

export const undoRetweet = async (userId: string, chirpId: string) => {
  await ensureChirpExists(chirpId);

  await prisma.retweet.deleteMany({
    where: {
      userId,
      chirpId,
    },
  });

  const retweetCount = await prisma.retweet.count({ where: { chirpId } });
  return { retweetCount };
};

export const getCommentsForChirp = async (chirpId: string) => {
  await ensureChirpExists(chirpId);

  return prisma.comment.findMany({
    where: { chirpId },
    include: {
      author: {
        select: { id: true, username: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
