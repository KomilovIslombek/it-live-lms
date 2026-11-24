import { z } from "zod";
import { formBoolean, formNumber, statusQuerySchema } from "./common.schema.js";

export const roleSchema = z.enum(["admin", "mentor", "assistant", "student"]);

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+998\d{9}$/);

export const listUsersQuerySchema = z.object({
  role: roleSchema.optional(),
  search: z.string().trim().optional(),
  status: statusQuerySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const optionalText = z
  .string()
  .trim()
  .max(255)
  .nullable()
  .optional()
  .transform((value) => (value === "" ? null : value));

export const createUserSchema = z.object({
  full_name: z.string().trim().min(1).max(255),
  phone: phoneSchema,
  password: z.string().min(8).max(72),
  role: roleSchema,
  email: z.email().toLowerCase().nullable().optional(),
  status: formBoolean.optional(),
  job: optionalText,
  experience: formNumber(z.number().int().min(0).max(100)).optional(),
  website: optionalText,
  info: z.string().trim().nullable().optional(),
  facebook: optionalText,
  telegram: optionalText,
  linkedin: optionalText,
  instagram: optionalText,
  github: optionalText,
});

export const updateUserSchema = createUserSchema.partial();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserInput = z.infer<typeof createUserSchema> & {
  profile_img?: string | null;
};
export type UpdateUserInput = z.infer<typeof updateUserSchema> & {
  profile_img?: string | null;
};
