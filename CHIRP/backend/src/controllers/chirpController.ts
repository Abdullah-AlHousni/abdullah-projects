import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { createChirp, getChirpById, getFeed, getUserChirps } from "../services/chirpService";
import { tryGetViewerId } from "../utils/viewer";

const parseLimit = (limitRaw: unknown, defaultValue: number) => {
  if (typeof limitRaw === "string") {
    const parsed = Number.parseInt(limitRaw, 10);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  if (Array.isArray(limitRaw)) {
    const candidate = limitRaw[0];
    if (typeof candidate === "string") {
      const parsed = Number.parseInt(candidate, 10);
      return Number.isFinite(parsed) ? parsed : defaultValue;
    }
  }

  return defaultValue;
};

export const createChirpHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { content, mediaUrl, mediaType } = req.body as {
      content?: string;
      mediaUrl?: string;
      mediaType?: "image" | "video";
    };

    const chirp = await createChirp(req.user.id, {
      content: content ?? "",
      mediaUrl,
      mediaType,
    });

    res.status(201).json({ chirp });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const getFeedHandler = async (req: Request, res: Response) => {
  try {
    const viewerId = tryGetViewerId(req.headers.authorization);
    const limit = parseLimit(req.query.limit, 20);
    const chirps = await getFeed(limit, viewerId);
    res.json({ chirps });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const getChirpHandler = async (req: Request, res: Response) => {
  try {
    const viewerId = tryGetViewerId(req.headers.authorization);
    const chirp = await getChirpById(req.params.chirpId, viewerId);
    res.json({ chirp });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const getUserChirpsHandler = async (req: Request, res: Response) => {
  try {
    const viewerId = tryGetViewerId(req.headers.authorization);
    const profile = await getUserChirps(req.params.username, viewerId);
    res.json({ profile });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};
