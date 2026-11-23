import type { PoolClient } from "pg";
import pool from "../db.js";
import { withTransaction } from "../utils/sql.js";
import type {
  CreateMaterialInput,
  MaterialFileInput,
  UpdateMaterialInput,
} from "../schemas/content.schema.js";

interface MaterialFile {
  id: number;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
}

export interface Material {
  id: number;
  lesson_id: number;
  description: string;
  files: MaterialFile[];
  created_at: Date;
  updated_at: Date;
}

// Each material with its files as a JSON array, in one query:
// json_agg collects the file rows of one material into [{...}, {...}].
// FILTER drops the single all-NULL row that LEFT JOIN gives a material
// without files, and COALESCE turns "no files" into [] instead of null.
// https://www.postgresql.org/docs/current/functions-aggregate.html
const SELECT_MATERIALS = `
  SELECT m.id, m.lesson_id, m.description,
    COALESCE(
      json_agg(json_build_object(
        'id', f.id, 'file_name', f.file_name, 'file_path', f.file_path,
        'mime_type', f.mime_type, 'file_size', f.file_size
      ) ORDER BY f.id) FILTER (WHERE f.id IS NOT NULL),
      '[]'
    ) AS files,
    m.created_at, m.updated_at
  FROM materials m
  LEFT JOIN material_files f ON f.material_id = m.id`;

export async function findByLesson(lessonId: number) {
  const { rows } = await pool.query<Material>(
    `${SELECT_MATERIALS} WHERE m.lesson_id = $1 GROUP BY m.id ORDER BY m.id`,
    [lessonId],
  );
  return rows;
}

export async function findById(id: number) {
  const { rows } = await pool.query<Material>(
    `${SELECT_MATERIALS} WHERE m.id = $1 GROUP BY m.id`,
    [id],
  );
  return rows[0] ?? null;
}

// Uses the transaction's client, not the pool (see withTransaction).
async function insertFiles(
  client: PoolClient,
  materialId: number,
  files: MaterialFileInput[],
) {
  for (const file of files) {
    await client.query(
      `INSERT INTO material_files (material_id, file_name, file_path, mime_type, file_size)
        VALUES ($1, $2, $3, $4, $5)`,
      [
        materialId,
        file.file_name,
        file.file_path,
        file.mime_type ?? null,
        file.file_size ?? null,
      ],
    );
  }
}

// The material and its files are saved together or not at all.
// Throws FOREIGN_KEY_VIOLATION when the lesson doesn't exist.
export async function insert(lessonId: number, input: CreateMaterialInput) {
  const id = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: number }>(
      `INSERT INTO materials (lesson_id, description) VALUES ($1, $2) RETURNING id`,
      [lessonId, input.description],
    );
    const materialId = rows[0]?.id;
    if (materialId === undefined)
      throw new Error("INSERT INTO materials returned no id");
    await insertFiles(client, materialId, input.files ?? []);
    return materialId;
  });
  return findById(id);
}

// Returns null when there is no material with this id.
// `files`, when sent, replaces the whole list of files.
export async function update(id: number, changes: UpdateMaterialInput) {
  const found = await withTransaction(async (client) => {
    // Always "touch" the row: it tells us whether it exists, and
    // updated_at changes even when only the files change.
    const { rows } = await client.query<{ id: number }>(
      `UPDATE materials SET description = COALESCE($1, description)
        WHERE id = $2 RETURNING id`,
      [changes.description ?? null, id],
    );
    if (!rows[0]) return false;

    if (changes.files !== undefined) {
      await client.query("DELETE FROM material_files WHERE material_id = $1", [
        id,
      ]);
      await insertFiles(client, id, changes.files);
    }
    return true;
  });
  if (!found) return null;
  return findById(id);
}

// Its files go with it (ON DELETE CASCADE).
export async function remove(id: number) {
  const { rowCount } = await pool.query("DELETE FROM materials WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
