import { Router } from "express";
import {
  commentChirpHandler,
  getCommentsHandler,
  likeChirpHandler,
  rechirpChirpHandler,
  undoRechirpHandler,
  unlikeChirpHandler,
} from "../controllers/engagementController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/chirps/:chirpId/like", authenticate, likeChirpHandler);
router.delete("/chirps/:chirpId/like", authenticate, unlikeChirpHandler);
router.post("/chirps/:chirpId/comments", authenticate, commentChirpHandler);
router.get("/chirps/:chirpId/comments", authenticate, getCommentsHandler);
router.post("/chirps/:chirpId/rechirp", authenticate, rechirpChirpHandler);
router.delete("/chirps/:chirpId/rechirp", authenticate, undoRechirpHandler);

export default router;
