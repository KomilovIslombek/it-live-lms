import type { Response } from "express";
import { z } from "zod";
import { idSchema } from "../schemas/common.schema.js";

// The same 400 shape as the login: { error, details: { field: [messages] } }
export function sendValidationError(res: Response, error: z.ZodError) {
  return res.status(400).json({
    error: "Invalid request",
    details: z.flattenError(error).fieldErrors,
  });
}

// For one field when the problem is found after validation
// (for example in the database): same shape as above.
export function sendFieldError(res: Response, field: string, message: string) {
  return res.status(400).json({
    error: "Invalid request",
    details: { [field]: [message] },
  });
}

// req.params.id → a number, or null for "abc", "0", "-1", "1.5".
export function parseId(value: unknown): number | null {
  const parsed = idSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
