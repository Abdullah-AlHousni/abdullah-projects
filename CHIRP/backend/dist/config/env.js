"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    PORT: zod_1.z.coerce.number().default(4000),
    DATABASE_URL: zod_1.z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET is required"),
    FRONTEND_ORIGIN: zod_1.z.string().min(1, "FRONTEND_ORIGIN is required"),
    AWS_ACCESS_KEY_ID: zod_1.z.string().min(1, "AWS_ACCESS_KEY_ID is required"),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().min(1, "AWS_SECRET_ACCESS_KEY is required"),
    AWS_REGION: zod_1.z.string().min(1, "AWS_REGION is required"),
    AWS_BUCKET_NAME: zod_1.z.string().min(1, "AWS_BUCKET_NAME is required"),
    GEMINI_API_KEY: zod_1.z.string().min(1, "GEMINI_API_KEY is required"),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("Invalid environment configuration", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
}
exports.env = parsed.data;
exports.default = exports.env;
