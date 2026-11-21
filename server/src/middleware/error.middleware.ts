import type { ErrorRequestHandler, Request, Response } from "express";
import { logError } from "../utils/logger.js";

export function notFound(_req: Request, res: Response) {
  return res.status(404).json({
    error: "Not found",
  });
}

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req,
  res,
  _next,
) => {
  if (
    typeof err === "object" &&
    err !== null &&
    "type" in err &&
    err.type === "entity.parse.failed"
  ) {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  logError(`500 ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({ error: "Internal server error" });
};
