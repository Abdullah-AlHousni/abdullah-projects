import { Router } from "express";
import { fetchFactCheck, triggerFactCheck } from "../controllers/factCheckController";

const router = Router();

router.post("/:chirpId", triggerFactCheck);
router.get("/:chirpId", fetchFactCheck);

export default router;
