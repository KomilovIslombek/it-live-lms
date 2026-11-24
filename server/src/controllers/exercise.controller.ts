import type { Request, Response } from "express";
import * as exercises from "../services/exercise.service.js";
import {
  createExerciseSchema,
  updateExerciseSchema,
} from "../schemas/content.schema.js";
import { parseId, sendValidationError } from "../utils/http.js";
import { FOREIGN_KEY_VIOLATION, pgError } from "../utils/pg-errors.js";
import { rowExists } from "../utils/sql.js";

// Same structure as material.controller.ts.

// GET /lessons/:lessonId/exercises
export async function listExercises(req: Request, res: Response) {
  const lessonId = parseId(req.params.lessonId);
  if (lessonId === null) return res.status(400).json({ error: "Invalid id" });

  if (!(await rowExists("lessons", lessonId))) {
    return res.status(404).json({ error: "Lesson not found" });
  }
  return res
    .status(200)
    .json({ exercises: await exercises.findByLesson(lessonId) });
}

// GET /exercises/:id
export async function getExercise(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const exercise = await exercises.findById(id);
  if (!exercise) return res.status(404).json({ error: "Exercise not found" });
  return res.status(200).json({ exercise });
}

// POST /lessons/:lessonId/exercises
export async function createExercise(req: Request, res: Response) {
  const lessonId = parseId(req.params.lessonId);
  if (lessonId === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = createExerciseSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const exercise = await exercises.insert(lessonId, parsed.data);
    return res.status(201).json({ exercise });
  } catch (err) {
    if (pgError(err).code === FOREIGN_KEY_VIOLATION) {
      return res.status(404).json({ error: "Lesson not found" });
    }
    throw err;
  }
}

// PATCH /exercises/:id
export async function updateExercise(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateExerciseSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const exercise = await exercises.update(id, parsed.data);
  if (!exercise) return res.status(404).json({ error: "Exercise not found" });
  return res.status(200).json({ exercise });
}

// DELETE /exercises/:id
export async function deleteExercise(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const deleted = await exercises.remove(id);
  if (!deleted) return res.status(404).json({ error: "Exercise not found" });
  return res.status(204).end();
}
