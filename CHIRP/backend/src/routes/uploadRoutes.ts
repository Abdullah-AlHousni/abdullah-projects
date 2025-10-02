import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middleware/authMiddleware";
import uploadMediaHandler from "../controllers/uploadController";
import { isImage, isVideo } from "../services/mediaService";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB
  },
  fileFilter: (_req, file, cb) => {
    if (isImage(file.mimetype) || isVideo(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(Object.assign(new Error("Only image and video uploads are allowed"), { status: 400 }));
  },
});

router.post("/", authenticate, upload.single("file"), uploadMediaHandler);

export default router;
