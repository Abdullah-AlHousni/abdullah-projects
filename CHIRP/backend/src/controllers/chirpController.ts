import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { createChirp, getChirpById, getFeed, getUserChirps } from "../services/chirpService";
import { tryGetViewerId } from "../utils/viewer";

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
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;
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
