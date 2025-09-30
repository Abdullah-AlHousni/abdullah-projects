import { z } from "zod";
import prisma from "../config/prisma";
import { comparePassword, hashPassword } from "../utils/password";
import { signToken } from "../utils/jwt";

const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24),
  password: z.string().min(6),
  bio: z.string().max(160).optional(),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(6),
});

export const registerUser = async (input: z.infer<typeof signupSchema>) => {
  const data = signupSchema.parse(input);

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }],
    },
  });

  if (existing) {
    throw Object.assign(new Error("Email or username already in use"), { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      username: data.username,
      passwordHash,
      bio: data.bio ?? "",
    },
  });

  const token = signToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  };
};

export const loginUser = async (input: z.infer<typeof loginSchema>) => {
  const data = loginSchema.parse(input);

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.emailOrUsername }, { username: data.emailOrUsername }],
    },
  });

  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const isValid = await comparePassword(data.password, user.passwordHash);
  if (!isValid) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const token = signToken(user.id);

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      username: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }

  return user;
};
