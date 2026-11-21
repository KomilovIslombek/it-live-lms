import { z } from "zod";

// Pieces that several modules share.

// A database id: a positive whole number that fits in a PostgreSQL INTEGER.
// z.coerce turns the string from the URL ("/courses/7" → "7") into a number.
export const idSchema = z.coerce.number().int().positive().max(2147483647);

// ?page=2&limit=10. Query values always arrive as strings, so coerce them.
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// ?status=true / ?status=false. Not z.coerce.boolean(): that one calls
// Boolean("false"), which is true, because any non-empty string is true.
export const statusQuerySchema = z
  .enum(["true", "false"])
  .transform((value) => value === "true");

// URL-friendly name: "frontend-react". Lowercase letters, digits, dashes.
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use only a-z, 0-9 and dashes");
