import type { Request, Response } from "express";
import * as courses from "../services/course.service.js";
import {
  createCourseSchema,
  listCoursesQuerySchema,
  updateCourseSchema,
} from "../schemas/course.schema.js";
import { parseId, sendFieldError, sendValidationError } from "../utils/http.js";
import { deleteStoredFile, uploadedPath } from "../utils/upload.js";
import {
  deleteStoredFiles,
  storedFilesOf,
} from "../services/stored-files.service.js";
import {
  FOREIGN_KEY_VIOLATION,
  isStillReferenced,
  pgError,
} from "../utils/pg-errors.js";

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

export async function getCourse(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const course = await courses.findById(id);
  if (!course) return res.status(404).json({ error: "Course not found" });

  return res.status(200).json({ course });
}

export async function createCourse(req: Request, res: Response) {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const banner = uploadedPath(req, "banner");
  if (!banner) {
    return sendFieldError(
      res,
      "banner",
      "Upload an image under the key banner",
    );
  }

  try {
    const course = await courses.insert({
      ...parsed.data,
      banner,
      intro_video: uploadedPath(req, "intro_video") ?? null,
    });
    return res.status(201).json({ course });
  } catch (err) {
    if (sendMissingReference(res, err)) return;
    throw err;
  }
}

export async function updateCourse(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateCourseSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const banner = uploadedPath(req, "banner");
  const introVideo = uploadedPath(req, "intro_video");
  const changes = {
    ...parsed.data,
    ...(banner ? { banner } : {}),
    ...(introVideo ? { intro_video: introVideo } : {}),
  };
  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const before = banner || introVideo ? await courses.findById(id) : null;
    const course = await courses.update(id, changes);
    if (!course) return res.status(404).json({ error: "Course not found" });
    if (banner) await deleteStoredFile(before?.banner);
    if (introVideo) await deleteStoredFile(before?.intro_video);
    return res.status(200).json({ course });
  } catch (err) {
    if (sendMissingReference(res, err)) return;
    throw err;
  }
}

export async function deleteCourse(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  try {
    const files = await storedFilesOf("course", id);
    const deleted = await courses.remove(id);
    if (!deleted) return res.status(404).json({ error: "Course not found" });
    await deleteStoredFiles(files);
    return res.status(204).end();
  } catch (err) {
    if (isStillReferenced(err)) {
      return res.status(409).json({
        error: "This course has payments. Set status: false instead",
      });
    }
    throw err;
  }
}
