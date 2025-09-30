import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import {
  commentOnChirp,
  getCommentsForChirp,
  likeChirp,
  rechirpChirp,
  undoRechirp,
  unlikeChirp,
} from "../services/engagementService";

export const likeChirpHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { likeCount } = await likeChirp(req.user.id, req.params.chirpId);
    res.json({ likeCount });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const unlikeChirpHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { likeCount } = await unlikeChirp(req.user.id, req.params.chirpId);
    res.json({ likeCount });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const commentChirpHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const comment = await commentOnChirp(req.user.id, req.params.chirpId, req.body);
    res.status(201).json({ comment });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const getCommentsHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const comments = await getCommentsForChirp(req.params.chirpId);
    res.json({ comments });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const rechirpChirpHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { rechirpCount } = await rechirpChirp(req.user.id, req.params.chirpId);
    res.json({ rechirpCount });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export const undoRechirpHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { rechirpCount } = await undoRechirp(req.user.id, req.params.chirpId);
    res.json({ rechirpCount });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};
