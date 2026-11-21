import type { Request, Response } from "express";
import * as categories from "../services/category.service.js";
import {
  createCategorySchema,
  updateCategorySchema,
} from "../schemas/category.schema.js";
import { parseId, sendFieldError, sendValidationError } from "../utils/http.js";
import {
  isStillReferenced,
  UNIQUE_VIOLATION,
  pgError,
} from "../utils/pg-errors.js";
import { slugify } from "../utils/slug.js";

const SLUG_TAKEN = "A category with this slug already exists";

// GET /admin/categories
export async function listCategories(_req: Request, res: Response) {
  return res.status(200).json({ categories: await categories.findAll() });
}

// GET /admin/categories/:id
export async function getCategory(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const category = await categories.findById(id);
  if (!category) return res.status(404).json({ error: "Category not found" });

  return res.status(200).json({ category });
}

// POST /admin/categories
export async function createCategory(req: Request, res: Response) {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { title, description, status } = parsed.data;
  const slug = parsed.data.slug ?? slugify(title);
  if (!slug) {
    return sendFieldError(
      res,
      "slug",
      "Can't make a slug from the title, send one",
    );
  }

  try {
    const category = await categories.insert({
      title,
      slug,
      description: description ?? null,
      status: status ?? true,
    });
    return res.status(201).json({ category });
  } catch (err) {
    if (pgError(err).code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: SLUG_TAKEN });
    }
    throw err; // anything else is a real 500, handled by errorHandler
  }
}

// PATCH /admin/categories/:id
export async function updateCategory(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  try {
    const category = await categories.update(id, parsed.data);
    if (!category) return res.status(404).json({ error: "Category not found" });
    return res.status(200).json({ category });
  } catch (err) {
    if (pgError(err).code === UNIQUE_VIOLATION) {
      return res.status(409).json({ error: SLUG_TAKEN });
    }
    throw err;
  }
}

// DELETE /admin/categories/:id
export async function deleteCategory(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  try {
    const deleted = await categories.remove(id);
    if (!deleted) return res.status(404).json({ error: "Category not found" });
    return res.status(204).end();
  } catch (err) {
    // ON DELETE RESTRICT: courses still use this category.
    if (isStillReferenced(err)) {
      return res.status(409).json({
        error: "Courses use this category. Move them or set status: false",
      });
    }
    throw err;
  }
}
