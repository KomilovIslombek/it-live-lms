import pool from "../db.js";
import { buildSet } from "../utils/sql.js";
import type { UpdateCategoryInput } from "../schemas/category.schema.js";

export interface Category {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  status: boolean;
  courses_count: number;
  created_at: Date;
  updated_at: Date;
}

const SELECT_CATEGORY = `
  SELECT c.id, c.title, c.slug, c.description, c.status,
    (SELECT COUNT(*)::int FROM courses co WHERE co.category_id = c.id) AS courses_count,
    c.created_at, c.updated_at
  FROM categories c`;

export async function findAll() {
  const { rows } = await pool.query<Category>(
    `${SELECT_CATEGORY} ORDER BY c.id`,
  );
  return rows;
}

export async function findById(id: number) {
  const { rows } = await pool.query<Category>(
    `${SELECT_CATEGORY} WHERE c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

interface NewCategory {
  title: string;
  slug: string;
  description: string | null;
  status: boolean;
}

export async function insert(category: NewCategory) {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO categories (title, slug, description, status)
      VALUES ($1, $2, $3, $4) RETURNING id`,
    [category.title, category.slug, category.description, category.status],
  );
  const id = rows[0]?.id;
  if (id === undefined)
    throw new Error("INSERT INTO categories returned no id");
  return findById(id);
}

export async function update(id: number, changes: UpdateCategoryInput) {
  const { set, values } = buildSet(changes);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE categories SET ${set} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findById(id);
}

export async function remove(id: number) {
  const { rowCount } = await pool.query(
    "DELETE FROM categories WHERE id = $1",
    [id],
  );
  return rowCount === 1;
}
