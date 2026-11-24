import type { Response } from "express";
import { z } from "zod";
import { idSchema } from "../schemas/common.schema.js";

export function sendValidationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    error: "Invalid request",
    details: z.flattenError(error).fieldErrors,
  });
}

export function sendFieldError(res: Response, field: string, message: string) {
  return res.status(400).json({
    error: "Invalid request",
    details: { [field]: [message] },
  });
}

export function parseId(value: unknown): number | null {
  const parsed = idSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
