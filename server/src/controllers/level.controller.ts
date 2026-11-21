import type { Request, Response } from "express";
import * as levels from "../services/level.service.js";
import {
  createLevelSchema,
  updateLevelSchema,
} from "../schemas/level.schema.js";
import { parseId, sendFieldError, sendValidationError } from "../utils/http.js";
import {
  isStillReferenced,
  UNIQUE_VIOLATION,
  pgError,
} from "../utils/pg-errors.js";
import { slugify } from "../utils/slug.js";

// Same structure as category.controller.ts.

const SLUG_TAKEN = "A level with this slug already exists";

// GET /admin/levels
export async function listLevels(_req: Request, res: Response) {
  return res.status(200).json({ levels: await levels.findAll() });
}

// GET /admin/levels/:id
export async function getLevel(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const level = await levels.findById(id);
  if (!level) return res.status(404).json({ error: "Level not found" });

  return res.status(200).json({ level });
}

// POST /admin/levels
export async function createLevel(req: Request, res: Response) {
  const parsed = createLevelSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { title, status } = parsed.data;
  const slug = parsed.data.slug ?? slugify(title);
  if (!slug) {
    return sendFieldError(
      res,
      "slug",
      "Can't make a slug from the title, send one",
    );
  }

  try {
    const level = await levels.insert({ title, slug, status: status ?? true });
    return res.status(201).json({ level });
  } catch (err) {
    if (pgError(err).code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: SLUG_TAKEN });
    }
    throw err;
  }
}

// PATCH /admin/levels/:id
export async function updateLevel(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateLevelSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const level = await levels.update(id, parsed.data);
    if (!level) return res.status(404).json({ error: "Level not found" });
    return res.status(200).json({ level });
  } catch (err) {
    if (pgError(err).code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: SLUG_TAKEN });
    }
    throw err;
  }
}

// DELETE /admin/levels/:id
export async function deleteLevel(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  try {
    const deleted = await levels.remove(id);
    if (!deleted) return res.status(404).json({ error: "Level not found" });
    return res.status(204).end();
  } catch (err) {
    if (isStillReferenced(err)) {
      return res.status(409).json({
        error: "Courses use this level. Move them or set status: false",
      });
    }
    throw err;
  }
}
