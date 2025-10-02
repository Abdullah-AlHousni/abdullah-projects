import prisma from "../config/prisma";

export const getProfileByUsername = async (username: string) => {
  const profile = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      bio: true,
      createdAt: true,
      chirps: {
        orderBy: { createdAt: "desc" },
        select: {
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
        },
      },
    },
  });

  if (!profile) {
    throw Object.assign(new Error("Profile not found"), { status: 404 });
  }

  return profile;
};
