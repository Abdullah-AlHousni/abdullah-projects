import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => ({
    folder: "chirp/uploads",
    resource_type: "auto",
    allowedFormats: ["jpg", "jpeg", "png", "gif", "mp4", "mov", "webm"],
    public_id: `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`,
  }),
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedMimePrefixes = ["image/", "video/"];
  const isAllowed = allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix));
  if (!isAllowed) {
    cb(new Error("Unsupported file type"));
    return;
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export default upload;
