import type { Request, Response } from "express";
import * as materials from "../services/material.service.js";
import {
  createMaterialSchema,
  updateMaterialSchema,
} from "../schemas/content.schema.js";
import { parseId, sendValidationError } from "../utils/http.js";
import { FOREIGN_KEY_VIOLATION, pgError } from "../utils/pg-errors.js";
import { rowExists } from "../utils/sql.js";

// Same structure as section.controller.ts.

// GET /admin/lessons/:lessonId/materials
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

// GET /admin/materials/:id
export async function getMaterial(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const material = await materials.findById(id);
  if (!material) return res.status(404).json({ error: "Material not found" });
  return res.status(200).json({ material });
}

// POST /admin/lessons/:lessonId/materials
export async function createMaterial(req: Request, res: Response) {
  const lessonId = parseId(req.params.lessonId);
  if (lessonId === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = createMaterialSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const material = await materials.insert(lessonId, parsed.data);
    return res.status(201).json({ material });
  } catch (err) {
    if (pgError(err).code === FOREIGN_KEY_VIOLATION) {
      return res.status(404).json({ error: "Lesson not found" });
    }
    throw err;
  }
}

// PATCH /admin/materials/:id
export async function updateMaterial(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateMaterialSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const material = await materials.update(id, parsed.data);
  if (!material) return res.status(404).json({ error: "Material not found" });
  return res.status(200).json({ material });
}

// DELETE /admin/materials/:id
export async function deleteMaterial(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const deleted = await materials.remove(id);
  if (!deleted) return res.status(404).json({ error: "Material not found" });
  return res.status(204).end();
}
