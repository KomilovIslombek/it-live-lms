import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token: string | undefined = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      error: "Not logged in!",
    });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({
      error: "Session expired or invalid",
    });
  }
}
