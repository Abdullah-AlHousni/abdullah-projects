import type { Request, Response } from "express";
import { getProfileByUsername } from "../services/profileService";
import { tryGetViewerId } from "../utils/viewer";

export const getProfileHandler = async (req: Request, res: Response) => {
  try {
    const viewerId = tryGetViewerId(req.headers.authorization);
    const profile = await getProfileByUsername(req.params.username, viewerId);
    res.json({ profile });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};
