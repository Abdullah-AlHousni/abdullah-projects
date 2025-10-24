"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./config/env"));
const prisma_1 = __importDefault(require("./config/prisma"));
const port = env_1.default.PORT;
const start = async () => {
    try {
        await prisma_1.default.$connect();
        app_1.default.listen(port, () => {
            console.log(`🚀 Chirp backend ready at http://localhost:${port}`);
        });
    }
    catch (error) {
        console.error("Failed to start server", error);
        process.exit(1);
    }
};
start();
const shutdown = async () => {
    await prisma_1.default.$disconnect();
    process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
