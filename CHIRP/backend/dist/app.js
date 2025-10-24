"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const env_1 = __importDefault(require("./config/env"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const chirpRoutes_1 = __importDefault(require("./routes/chirpRoutes"));
const engagementRoutes_1 = __importDefault(require("./routes/engagementRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const factCheckRoutes_1 = __importDefault(require("./routes/factCheckRoutes"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.default.FRONTEND_ORIGIN,
    credentials: true,
}));
app.use(express_1.default.json({ limit: "12mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)("dev"));
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
app.use("/auth", authRoutes_1.default);
app.use("/chirps", chirpRoutes_1.default);
app.use("/engagements", engagementRoutes_1.default);
app.use("/profiles", profileRoutes_1.default);
app.use("/upload", uploadRoutes_1.default);
app.use("/api/factcheck", factCheckRoutes_1.default);
app.use(errorHandler_1.default);
exports.default = app;
