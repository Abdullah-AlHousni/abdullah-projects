import type { Request, Response } from "express";
import { getFactCheckByChirp, requestFactCheck } from "../services/factCheckService";

export const triggerFactCheck = async (req: Request, res: Response) => {
  try {
    const { chirpId } = req.params;
    if (!chirpId) {
      return res.status(400).json({ message: "chirpId is required" });
    }

    const factCheck = await requestFactCheck(chirpId);
    res.status(202).json({ factCheck });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to schedule fact check";
    res.status(500).json({ message });
  }
};

export const fetchFactCheck = async (req: Request, res: Response) => {
  try {
    const { chirpId } = req.params;
    if (!chirpId) {
      return res.status(400).json({ message: "chirpId is required" });
    }

    const factCheck = await getFactCheckByChirp(chirpId);
    if (!factCheck) {
      return res.status(404).json({ message: "Fact check not found" });
    }

    res.json({ factCheck });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch fact check";
    res.status(500).json({ message });
  }
};
