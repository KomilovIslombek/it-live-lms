import type { Request, Response } from "express";
import * as courses from "../services/course.service.js";
import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from "../schemas/course.schema.js";
import { parseId, sendFieldError, sendValidationError } from "../utils/http.js";
import {
  FOREIGN_KEY_VIOLATION,
  isStillReferenced,
  pgError,
} from "../utils/pg-errors.js";

// When category_id or level_id points to nothing, PostgreSQL refuses the
// INSERT/UPDATE with FOREIGN_KEY_VIOLATION and names the constraint. Turn
// that into a normal 400 for the right field. Returns false when the error
// is something else (then the caller rethrows it → 500).
function sendMissingReference(res: Response, err: unknown) {
  const { code, constraint } = pgError(err);
  if (code !== FOREIGN_KEY_VIOLATION) return false;

  if (constraint === "courses_category_id_foreign") {
    sendFieldError(res, "category_id", "Category not found");
  } else if (constraint === "courses_level_id_foreign") {
    sendFieldError(res, "level_id", "Level not found");
  } else {
    return false;
  }
  return true;
}

// GET /admin/courses?search=&category_id=&level_id=&status=&page=&limit=
export async function listCourses(req: Request, res: Response) {
  const parsed = listCoursesQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { courses: page, total } = await courses.findPage(parsed.data);
  return res.status(200).json({
    courses: page,
    page: parsed.data.page,
    limit: parsed.data.limit,
    total,
  });
}

// GET /admin/courses/:id
export async function getCourse(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const course = await courses.findById(id);
  if (!course) return res.status(404).json({ error: "Course not found" });

  return res.status(200).json({ course });
}

// POST /admin/courses
export async function createCourse(req: Request, res: Response) {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const course = await courses.insert(parsed.data);
    return res.status(201).json({ course });
  } catch (err) {
    if (sendMissingReference(res, err)) return;
    throw err;
  }
}

// PATCH /admin/courses/:id
export async function updateCourse(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateCourseSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const course = await courses.update(id, parsed.data);
    if (!course) return res.status(404).json({ error: "Course not found" });
    return res.status(200).json({ course });
  } catch (err) {
    if (sendMissingReference(res, err)) return;
    throw err;
  }
}

// DELETE /admin/courses/:id
export async function deleteCourse(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  try {
    const deleted = await courses.remove(id);
    if (!deleted) return res.status(404).json({ error: "Course not found" });
    return res.status(204).end();
  } catch (err) {
    // ON DELETE RESTRICT on payments: money records must stay.
    if (isStillReferenced(err)) {
      return res.status(409).json({
        error: "This course has payments. Set status: false instead",
      });
    }
    throw err;
  }
}
