import { z } from "zod";
import { slugSchema } from "./common.schema.js";

export const createLevelSchema = z.object({
  title: z.string().trim().min(1).max(255),
  slug: slugSchema.optional(),
  status: z.boolean().optional(),
});

export const updateLevelSchema = createLevelSchema.partial();

export type UpdateLevelInput = z.infer<typeof updateLevelSchema>;
