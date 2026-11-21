import { z } from "zod";

export const listUsersQuerySchema = z.object({
  role: z.enum(["admin", "mentor", "assistant", "student"]).optional(),
  // trim: "  ali " → "ali", and "   " → "" (empty = no search)
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  //   status: z.enum(["active", "inactive"]).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
