import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${statusCode} - ${message}`, err.stack);

  const errorResponse: { message: string; stack?: string; details?: unknown } =
    { message };

  if (process.env.NODE_ENV === "development" && err.stack) {
    errorResponse.stack = err.stack;
  }
  if (err.details) {
    errorResponse.details = err.details;
  }

  res.status(statusCode).json({
    success: false,
    error: errorResponse,
  });
};
