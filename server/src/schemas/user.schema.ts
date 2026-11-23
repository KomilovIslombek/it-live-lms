import { z } from "zod";
import { statusQuerySchema } from "./common.schema.js";

export const roleSchema = z.enum(["admin", "mentor", "assistant", "student"]);

// The same rule as the login: +998 and 9 digits.
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+998\d{9}$/);

export const listUsersQuerySchema = z.object({
  role: roleSchema.optional(),
  // trim: "  ali " → "ali", and "   " → "" (empty = no search)
  search: z.string().trim().optional(),
  // ?status=true / ?status=false (active / inactive)
  status: statusQuerySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Optional text: "" from an empty form field is saved as null.
const optionalText = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .optional()
  .transform((value) => (value === "" ? null : value));

// POST /admin/users. Profile fields (job, experience, links...) are for
// mentors, shown on the course page. No .default() here, see
// category.schema.ts.
export const createUserSchema = z.object({
  full_name: z.string().trim().min(1).max(255),
  phone: phoneSchema,
  password: z.string().min(8).max(72), // bcrypt uses only the first 72 bytes
  role: roleSchema,
  email: z.email().toLowerCase().nullable().optional(),
  status: z.boolean().optional(),
  profile_img: optionalText,
  job: optionalText,
  experience: z.number().int().min(0).max(100).nullable().optional(),
  website: optionalText,
  info: z.string().trim().nullable().optional(),
  facebook: optionalText,
  telegram: optionalText,
  linkedin: optionalText,
  instagram: optionalText,
  github: optionalText,
});

// PATCH /admin/users/:id: any of the same fields. A new password is hashed
// like on create; a new role is looked up in the roles table.
export const updateUserSchema = createUserSchema.partial();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
