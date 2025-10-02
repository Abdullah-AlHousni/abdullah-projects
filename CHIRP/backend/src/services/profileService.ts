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
      const viewerHasLiked = viewerId ? Boolean((chirp as { likes?: Array<{ id: string }> }).likes?.length) : false;
      const viewerHasRechirped = viewerId
        ? Boolean((chirp as { retweets?: Array<{ id: string }> }).retweets?.length)
        : false;

      const { likes, retweets, ...rest } = chirp as typeof chirp & {
        likes?: Array<{ id: string }>;
        retweets?: Array<{ id: string }>;
      };

      return {
        ...rest,
        viewerHasLiked,
        viewerHasRechirped,
      };
    }),
  };
};
