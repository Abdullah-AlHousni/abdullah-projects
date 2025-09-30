import { Router } from "express";
import {
  createChirpHandler,
  getChirpHandler,
  getFeedHandler,
  getUserChirpsHandler,
} from "../controllers/chirpController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/feed", getFeedHandler);
router.get("/user/:username", getUserChirpsHandler);
router.get("/:chirpId", getChirpHandler);
router.post("/", authenticate, createChirpHandler);

export default router;
