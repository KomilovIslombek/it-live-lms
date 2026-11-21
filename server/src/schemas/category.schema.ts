import { z } from "zod";
import { slugSchema } from "./common.schema.js";

// POST /admin/categories. No .default() here: the database already has
// defaults (status = true), and a default would break the PATCH schema
// below (a PATCH without status would switch the category back on).
export const createCategorySchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: slugSchema.optional(), // made from the title when left out
  description: z.string().trim().nullable().optional(),
  status: z.boolean().optional(),
});

// PATCH /admin/categories/:id: the same fields, all optional.
export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
