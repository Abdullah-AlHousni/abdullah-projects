import type { NextFunction, Request, Response } from "express";
import type { MulterError } from "multer";

const isMulterError = (error: unknown): error is MulterError =>
  Boolean(error) && typeof error === "object" && (error as MulterError).name === "MulterError";

// Generic error handler so unhandled errors consistently bubble to clients
export const errorHandler = (
  err: (Error & { status?: number }) | MulterError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (isMulterError(err)) {
    const statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return res.status(statusCode).json({ message: err.message });
  }

  const statusCode = err.status ?? 500;
  const message = err.message || "Something went wrong";
  if (statusCode >= 500) {
    console.error("Unhandled error", err);
  }
  res.status(statusCode).json({ message });
};

export default errorHandler;
