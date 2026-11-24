import type { Request, Response } from "express";
import * as materials from "../services/material.service.js";
import {
  createMaterialSchema,
  updateMaterialSchema,
} from "../schemas/content.schema.js";
import { parseId, sendValidationError } from "../utils/http.js";
import { FOREIGN_KEY_VIOLATION, pgError } from "../utils/pg-errors.js";
import { rowExists } from "../utils/sql.js";
import { fileRows } from "../utils/upload.js";
import {
  deleteStoredFiles,
  storedFilesOf,
} from "../services/stored-files.service.js";

export async function listMaterials(req: Request, res: Response) {
  const lessonId = parseId(req.params.lessonId);
  if (lessonId === null) return res.status(400).json({ error: "Invalid id" });

  if (!(await rowExists("lessons", lessonId))) {
    return res.status(404).json({ error: "Lesson not found" });
  }
  return res
    .status(200)
    .json({ materials: await materials.findByLesson(lessonId) });
}

export async function getMaterial(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const material = await materials.findById(id);
  if (!material) return res.status(404).json({ error: "Material not found" });
  return res.status(200).json({ material });
}

export async function createMaterial(req: Request, res: Response) {
  const lessonId = parseId(req.params.lessonId);
  if (lessonId === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = createMaterialSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const material = await materials.insert(lessonId, {
      ...parsed.data,
      files: fileRows(req, "files"),
    });
    return res.status(201).json({ material });
  } catch (err) {
    if (pgError(err).code === FOREIGN_KEY_VIOLATION) {
      return res.status(404).json({ error: "Lesson not found" });
    }
    throw err;
  }
}

export async function updateMaterial(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateMaterialSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const files = fileRows(req, "files");
  const changes = { ...parsed.data, ...(files.length ? { files } : {}) };
  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const oldFiles = files.length ? await storedFilesOf("material", id) : [];
  const material = await materials.update(id, changes);
  if (!material) return res.status(404).json({ error: "Material not found" });
  await deleteStoredFiles(oldFiles);
  return res.status(200).json({ material });
}

export async function deleteMaterial(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const files = await storedFilesOf("material", id);
  const deleted = await materials.remove(id);
  if (!deleted) return res.status(404).json({ error: "Material not found" });
  await deleteStoredFiles(files);
  return res.status(204).end();
}
