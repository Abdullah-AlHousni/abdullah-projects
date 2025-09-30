import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { createChirp, getChirpById, getFeed, getUserChirps } from "../services/chirpService";

export const createChirpHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chirp = await createChirp(req.user.id, {
      content: req.body.content,
    });

    res.status(201).json({ chirp });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const getFeedHandler = async (req: Request, res: Response) => {
  try {
    const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 20;
    const chirps = await getFeed(limit);
    res.json({ chirps });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const getChirpHandler = async (req: Request, res: Response) => {
  try {
    const chirp = await getChirpById(req.params.chirpId);
    res.json({ chirp });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const getUserChirpsHandler = async (req: Request, res: Response) => {
  try {
    const profile = await getUserChirps(req.params.username);
    res.json({ profile });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};
