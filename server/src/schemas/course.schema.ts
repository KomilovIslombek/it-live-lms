import { z } from "zod";
import {
  formBoolean,
  formNumber,
  idSchema,
  paginationSchema,
  statusQuerySchema,
} from "./common.schema.js";

export const createCourseSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  price: formNumber(z.number().min(0).max(9_999_999_999.99)),
  category_id: idSchema,
  level_id: idSchema,
  status: formBoolean.optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const listCoursesQuerySchema = paginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  category_id: idSchema.optional(),
  level_id: idSchema.optional(),
  status: statusQuerySchema.optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema> & {
  banner: string;
  intro_video?: string | null;
};
export type UpdateCourseInput = z.infer<typeof updateCourseSchema> & {
  banner?: string;
  intro_video?: string | null;
};
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
