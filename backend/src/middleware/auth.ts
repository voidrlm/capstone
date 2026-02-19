import { NextFunction, Request, Response } from "express";
import { JwtUserPayload, verifyAccessToken } from "../utils/jwt.js";

export interface AuthenticatedRequest extends Request {
  user?: JwtUserPayload;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { message: "Missing or invalid authorization header" },
    });
    return;
  }

  const token = authorizationHeader.slice(7).trim();

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (_error) {
    res.status(401).json({
      success: false,
      error: { message: "Invalid or expired token" },
    });
  }
}
