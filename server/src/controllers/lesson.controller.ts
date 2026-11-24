import type { Request, Response } from "express";
import * as lessons from "../services/lesson.service.js";
import {
  createLessonSchema,
  updateLessonSchema,
} from "../schemas/content.schema.js";
import { parseId, sendValidationError } from "../utils/http.js";
import { FOREIGN_KEY_VIOLATION, pgError } from "../utils/pg-errors.js";
import { rowExists } from "../utils/sql.js";
import { deleteStoredFile, uploadedPath } from "../utils/upload.js";
import {
  deleteStoredFiles,
  storedFilesOf,
} from "../services/stored-files.service.js";

export async function listLessons(req: Request, res: Response) {
  const sectionId = parseId(req.params.sectionId);
  if (sectionId === null) return res.status(400).json({ error: "Invalid id" });

  if (!(await rowExists("sections", sectionId))) {
    return res.status(404).json({ error: "Section not found" });
  }
  return res
    .status(200)
    .json({ lessons: await lessons.findBySection(sectionId) });
}

export async function getLesson(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const lesson = await lessons.findById(id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  return res.status(200).json({ lesson });
}

export async function createLesson(req: Request, res: Response) {
  const sectionId = parseId(req.params.sectionId);
  if (sectionId === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = createLessonSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const lesson = await lessons.insert(sectionId, {
      ...parsed.data,
      video_url: uploadedPath(req, "video") ?? null,
    });
    return res.status(201).json({ lesson });
  } catch (err) {
    if (pgError(err).code === FOREIGN_KEY_VIOLATION) {
      return res.status(404).json({ error: "Section not found" });
    }
    throw err;
  }
}

export async function updateLesson(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateLessonSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const video = uploadedPath(req, "video");
  const changes = { ...parsed.data, ...(video ? { video_url: video } : {}) };
  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const before = video ? await lessons.findById(id) : null;
  const lesson = await lessons.update(id, changes);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  if (video) await deleteStoredFile(before?.video_url);
  return res.status(200).json({ lesson });
}

export async function deleteLesson(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const files = await storedFilesOf("lesson", id);
  const deleted = await lessons.remove(id);
  if (!deleted) return res.status(404).json({ error: "Lesson not found" });
  await deleteStoredFiles(files);
  return res.status(204).end();
}
