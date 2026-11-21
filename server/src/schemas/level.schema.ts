import { z } from "zod";
import { slugSchema } from "./common.schema.js";

// Course levels: Beginner, Intermediate, Advanced. Same rules as categories
// (see category.schema.ts for why there is no .default()).
export const createLevelSchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: slugSchema.optional(), // made from the title when left out
  status: z.boolean().optional(),
});

export const updateLevelSchema = createLevelSchema.partial();

export type UpdateLevelInput = z.infer<typeof updateLevelSchema>;
