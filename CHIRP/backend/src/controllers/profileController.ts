import type { Request, Response } from "express";
import { getProfileByUsername } from "../services/profileService";

export const getProfileHandler = async (req: Request, res: Response) => {
  try {
    const profile = await getProfileByUsername(req.params.username);
    res.json({ profile });
  } catch (error) {
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};
