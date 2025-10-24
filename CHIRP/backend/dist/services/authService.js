"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.loginUser = exports.registerUser = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../config/prisma"));
const password_1 = require("../utils/password");
const jwt_1 = require("../utils/jwt");
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3).max(24),
    password: zod_1.z.string().min(6),
    bio: zod_1.z.string().max(160).optional(),
});
const loginSchema = zod_1.z.object({
    emailOrUsername: zod_1.z.string().min(1),
    password: zod_1.z.string().min(6),
});
const registerUser = async (input) => {
    const data = signupSchema.parse(input);
    const existing = await prisma_1.default.user.findFirst({
        where: {
            OR: [{ email: data.email }, { username: data.username }],
        },
    });
    if (existing) {
        throw Object.assign(new Error("Email or username already in use"), { status: 409 });
    }
    const passwordHash = await (0, password_1.hashPassword)(data.password);
    const user = await prisma_1.default.user.create({
        data: {
            email: data.email,
            username: data.username,
            passwordHash,
            bio: data.bio ?? "",
        },
    });
    const token = (0, jwt_1.signToken)(user.id);
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
exports.registerUser = registerUser;
const loginUser = async (input) => {
    const data = loginSchema.parse(input);
    const user = await prisma_1.default.user.findFirst({
        where: {
            OR: [{ email: data.emailOrUsername }, { username: data.emailOrUsername }],
        },
    });
    if (!user) {
        throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }
    const isValid = await (0, password_1.comparePassword)(data.password, user.passwordHash);
    if (!isValid) {
        throw Object.assign(new Error("Invalid credentials"), { status: 401 });
    }
    const token = (0, jwt_1.signToken)(user.id);
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
exports.loginUser = loginUser;
const getCurrentUser = async (userId) => {
    const user = await prisma_1.default.user.findUnique({
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
exports.getCurrentUser = getCurrentUser;
