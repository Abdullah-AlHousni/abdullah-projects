import { PutObjectCommand } from "@aws-sdk/client-s3";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import s3Client from "../config/s3";
import env from "../config/env";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const IMAGE_MIME_PREFIX = "image/";
const VIDEO_MIME_PREFIX = "video/";

const UPLOAD_BASE_PATH = "chirps";

export const isImage = (mimetype: string) => mimetype.startsWith(IMAGE_MIME_PREFIX);

export const isVideo = (mimetype: string) => mimetype.startsWith(VIDEO_MIME_PREFIX);

const buildObjectKey = (extension: string) => {
  const id = randomUUID();
  return `${UPLOAD_BASE_PATH}/${new Date().toISOString()}-${id}.${extension}`;
};

const optimiseImage = async (buffer: Buffer) => {
  const processed = await sharp(buffer)
    .rotate()
    .resize({ width: 1080, withoutEnlargement: true })
    .withMetadata({})
    .webp({ quality: 70 })
    .toBuffer();

  return {
    buffer: processed,
    contentType: "image/webp",
    extension: "webp",
  } as const;
};

const transcodeVideo = async (buffer: Buffer) => {
  const id = randomUUID();
  const inputPath = join(tmpdir(), `${id}-input`);
  const outputPath = join(tmpdir(), `${id}-output.mp4`);

  await fs.writeFile(inputPath, buffer);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions(
          "-vf",
          "scale='-2:min(720,ih)'",
          "-c:v",
          "libx264",
          "-preset",
          "medium",
          "-crf",
          "23",
          "-c:a",
          "aac",
          "-b:a",
          "128k",
          "-movflags",
          "+faststart",
          "-maxrate",
          "3000k",
          "-bufsize",
          "6000k",
        )
        .output(outputPath)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });

    const processed = await fs.readFile(outputPath);
    return {
      buffer: processed,
      contentType: "video/mp4",
      extension: "mp4",
    } as const;
  } finally {
    await Promise.all([
      fs.unlink(inputPath).catch(() => undefined),
      fs.unlink(outputPath).catch(() => undefined),
    ]);
  }
};

export const uploadBufferToS3 = async (
  buffer: Buffer,
  contentType: string,
  extension: string,
) => {
  const Key = buildObjectKey(extension);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  const baseUrl = `https://${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com`;
  return `${baseUrl}/${Key}`;
};

export const processAndUploadMedia = async (file: Express.Multer.File) => {
  if (!file.mimetype) {
    throw Object.assign(new Error("File mimetype missing"), { status: 400 });
  }

  if (isImage(file.mimetype)) {
    const { buffer, contentType, extension } = await optimiseImage(file.buffer);
    const url = await uploadBufferToS3(buffer, contentType, extension);
    return { url, mediaType: "image" as const };
  }

  if (isVideo(file.mimetype)) {
    const { buffer, contentType, extension } = await transcodeVideo(file.buffer);
    const url = await uploadBufferToS3(buffer, contentType, extension);
    return { url, mediaType: "video" as const };
  }

  throw Object.assign(new Error("Only image and video uploads are supported"), { status: 400 });
};
