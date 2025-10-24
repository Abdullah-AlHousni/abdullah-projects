"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const isMulterError = (error) => Boolean(error) && typeof error === "object" && error.name === "MulterError";
// Generic error handler so unhandled errors consistently bubble to clients
const errorHandler = (err, _req, res, _next) => {
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
exports.errorHandler = errorHandler;
exports.default = exports.errorHandler;
