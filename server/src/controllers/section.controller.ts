import type { Request, Response } from "express";
import * as sections from "../services/section.service.js";
import {
  createSectionSchema,
  updateSectionSchema,
} from "../schemas/content.schema.js";
import { parseId, sendValidationError } from "../utils/http.js";
import { FOREIGN_KEY_VIOLATION, pgError } from "../utils/pg-errors.js";
import { rowExists } from "../utils/sql.js";

import {
  deleteStoredFiles,
  storedFilesOf,
} from "../services/stored-files.service.js";

export async function listSections(req: Request, res: Response) {
  const courseId = parseId(req.params.courseId);
  if (courseId === null) return res.status(400).json({ error: "Invalid id" });

  if (!(await rowExists("courses", courseId))) {
    return res.status(404).json({ error: "Course not found" });
  }
  return res
    .status(200)
    .json({ sections: await sections.findByCourse(courseId) });
}

export async function getSection(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const section = await sections.findById(id);
  if (!section) return res.status(404).json({ error: "Section not found" });
  return res.status(200).json({ section });
}

export async function createSection(req: Request, res: Response) {
  const courseId = parseId(req.params.courseId);
  if (courseId === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = createSectionSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const section = await sections.insert(courseId, parsed.data);
    return res.status(201).json({ section });
  } catch (err) {
    if (pgError(err).code === FOREIGN_KEY_VIOLATION) {
      return res.status(404).json({ error: "Course not found" });
    }
    throw err;
  }
}

export async function updateSection(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateSectionSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const section = await sections.update(id, parsed.data);
  if (!section) return res.status(404).json({ error: "Section not found" });
  return res.status(200).json({ section });
}

export async function deleteSection(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const files = await storedFilesOf("section", id);
  const deleted = await sections.remove(id);
  if (!deleted) return res.status(404).json({ error: "Section not found" });
  await deleteStoredFiles(files);
  return res.status(204).end();
}
