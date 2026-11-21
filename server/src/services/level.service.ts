import pool from "../db.js";
import { buildSet } from "../utils/sql.js";
import type { UpdateLevelInput } from "../schemas/level.schema.js";

// Same structure as category.service.ts.

export interface Level {
  id: number;
  title: string;
  slug: string | null;
  status: boolean;
  courses_count: number;
  created_at: Date;
  updated_at: Date;
}

const SELECT_LEVEL = `
  SELECT l.id, l.title, l.slug, l.status,
    (SELECT COUNT(*)::int FROM courses co WHERE co.level_id = l.id) AS courses_count,
    l.created_at, l.updated_at
  FROM levels l`;

export async function findAll() {
  const { rows } = await pool.query<Level>(`${SELECT_LEVEL} ORDER BY l.id`);
  return rows;
}

export async function findById(id: number) {
  const { rows } = await pool.query<Level>(`${SELECT_LEVEL} WHERE l.id = $1`, [
    id,
  ]);
  return rows[0] ?? null;
}

interface NewLevel {
  title: string;
  slug: string;
  status: boolean;
}

export async function insert(level: NewLevel) {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO levels (title, slug, status) VALUES ($1, $2, $3) RETURNING id`,
    [level.title, level.slug, level.status],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error("INSERT INTO levels returned no id");
  return findById(id);
}

export async function update(id: number, changes: UpdateLevelInput) {
  const { set, values } = buildSet(changes);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE levels SET ${set} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findById(id);
}

export async function remove(id: number) {
  const { rowCount } = await pool.query("DELETE FROM levels WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
