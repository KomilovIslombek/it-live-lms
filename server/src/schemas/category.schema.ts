import { z } from "zod";
import { slugSchema } from "./common.schema.js";

export const createCategorySchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: slugSchema.optional(),
  description: z.string().trim().nullable().optional(),
  status: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
