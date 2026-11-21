import { z } from "zod";
import {
  idSchema,
  paginationSchema,
  statusQuerySchema,
} from "./common.schema.js";

// POST /admin/courses. banner and intro_video are URLs or paths for now;
// real file uploads come later. price is in UZS; the database column is
// NUMERIC(12, 2), so the largest value is 9 999 999 999.99.
export const createCourseSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  price: z.number().min(0).max(9_999_999_999.99),
  banner: z.string().trim().min(1).max(255),
  intro_video: z.string().trim().max(255).nullable().optional(),
  category_id: idSchema,
  level_id: idSchema,
  status: z.boolean().optional(),
});

// PATCH /admin/courses/:id
export const updateCourseSchema = createCourseSchema.partial();

// GET /admin/courses?search=react&category_id=1&level_id=2&status=true&page=1&limit=10
export const listCoursesQuerySchema = paginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  category_id: idSchema.optional(),
  level_id: idSchema.optional(),
  status: statusQuerySchema.optional(),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
