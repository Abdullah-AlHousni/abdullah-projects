import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { processAndUploadMedia } from "../services/mediaService";

export const uploadMediaHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { url, mediaType } = await processAndUploadMedia(req.file);
    res.status(201).json({ url, mediaType });
  } catch (error) {
    console.error("Media upload failed", error);
    const status = (error as Error & { status?: number }).status ?? 500;
    res.status(status).json({ message: (error as Error).message });
  }
};

export default uploadMediaHandler;
