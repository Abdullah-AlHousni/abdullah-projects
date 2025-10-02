import prisma from "../config/prisma";

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
    chirps: profile.chirps.map((chirp) => {
      const raw = chirp as unknown as {
        likes?: Array<{ id: string }>;
        retweets?: Array<{ id: string }>;
      } & Record<string, unknown>;

      const { likes, retweets, ...rest } = raw;

      return {
        ...rest,
        viewerHasLiked: viewerId ? Boolean(likes?.length) : false,
        viewerHasRechirped: viewerId ? Boolean(retweets?.length) : false,
      };
    }),
  };
};
