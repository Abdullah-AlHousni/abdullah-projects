import type { NextFunction, Request, Response } from "express";

// Generic error handler so unhandled errors consistently bubble to clients
export const errorHandler = (
  err: Error & { status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.status ?? 500;
  const message = err.message || "Something went wrong";
  if (statusCode >= 500) {
    console.error("Unhandled error", err);
  }
  res.status(statusCode).json({ message });
};

export default errorHandler;
