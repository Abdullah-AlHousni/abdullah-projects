import prisma from "../config/prisma";

const formatProfileChirp = (chirp: any, viewerId?: string) => {
  const viewerHasLiked = viewerId ? Boolean(chirp?.likes?.length) : false;
  const viewerHasRechirped = viewerId ? Boolean(chirp?.retweets?.length) : false;
  const { likes, retweets, ...rest } = chirp ?? {};

  return {
    ...rest,
    viewerHasLiked,
    viewerHasRechirped,
  };
};

export const getProfileByUsername = async (username: string, viewerId?: string) => {
  const profile = await prisma.user.findUnique({
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
    chirps: profile.chirps.map((chirp: any) => formatProfileChirp(chirp, viewerId)),
  };
};
