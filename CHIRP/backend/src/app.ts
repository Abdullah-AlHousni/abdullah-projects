import cors from "cors";
import express from "express";
import morgan from "morgan";
import env from "./config/env";
import authRoutes from "./routes/authRoutes";
import chirpRoutes from "./routes/chirpRoutes";
import engagementRoutes from "./routes/engagementRoutes";
import profileRoutes from "./routes/profileRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import factCheckRoutes from "./routes/factCheckRoutes";
import errorHandler from "./middleware/errorHandler";

const app = express();

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/chirps", chirpRoutes);
app.use("/engagements", engagementRoutes);
app.use("/profiles", profileRoutes);
app.use("/upload", uploadRoutes);
app.use("/api/factcheck", factCheckRoutes);

app.use(errorHandler);

export default app;
