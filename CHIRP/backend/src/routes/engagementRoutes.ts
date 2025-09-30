import { Router } from "express";
import {
  commentChirpHandler,
  getCommentsHandler,
  likeChirpHandler,
  retweetChirpHandler,
  undoRetweetHandler,
  unlikeChirpHandler,
} from "../controllers/engagementController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/chirps/:chirpId/like", authenticate, likeChirpHandler);
router.delete("/chirps/:chirpId/like", authenticate, unlikeChirpHandler);
router.post("/chirps/:chirpId/comments", authenticate, commentChirpHandler);
router.get("/chirps/:chirpId/comments", authenticate, getCommentsHandler);
router.post("/chirps/:chirpId/retweet", authenticate, retweetChirpHandler);
router.delete("/chirps/:chirpId/retweet", authenticate, undoRetweetHandler);

export default router;
