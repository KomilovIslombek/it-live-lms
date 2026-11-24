import type { PoolClient } from "pg";
import pool from "../db.js";
import { withTransaction } from "../utils/sql.js";
import type {
  CreateExerciseInput,
  MaterialFileInput,
  UpdateExerciseInput,
} from "../schemas/content.schema.js";

interface ExerciseFile {
  id: number;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
}

export interface Exercise {
  id: number;
  lesson_id: number;
  title: string;
  files: ExerciseFile[];
  created_at: Date;
  updated_at: Date;
}

const SELECT_EXERCISES = `
  SELECT x.id, x.lesson_id, x.title,
    COALESCE(
      json_agg(json_build_object(
        'id', f.id, 'file_name', f.file_name, 'file_path', f.file_path,
        'mime_type', f.mime_type, 'file_size', f.file_size
      ) ORDER BY f.id) FILTER (WHERE f.id IS NOT NULL),
      '[]'
    ) AS files,
    x.created_at, x.updated_at
  FROM exercises x
  LEFT JOIN exercise_files f ON f.exercise_id = x.id`;

export async function findByLesson(lessonId: number) {
  const { rows } = await pool.query<Exercise>(
    `${SELECT_EXERCISES} WHERE x.lesson_id = $1 GROUP BY x.id ORDER BY x.id`,
    [lessonId],
  );
  return rows;
}

export async function findById(id: number) {
  const { rows } = await pool.query<Exercise>(
    `${SELECT_EXERCISES} WHERE x.id = $1 GROUP BY x.id`,
    [id],
  );
  return rows[0] ?? null;
}

async function insertFiles(
  client: PoolClient,
  exerciseId: number,
  files: MaterialFileInput[],
) {
  for (const file of files) {
    await client.query(
      `INSERT INTO exercise_files (exercise_id, file_name, file_path, mime_type, file_size)
        VALUES ($1, $2, $3, $4, $5)`,
      [
        exerciseId,
        file.file_name,
        file.file_path,
        file.mime_type ?? null,
        file.file_size ?? null,
      ],
    );
  }
}

export async function insert(lessonId: number, input: CreateExerciseInput) {
  const id = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: number }>(
      "INSERT INTO exercises (lesson_id, title) VALUES ($1, $2) RETURNING id",
      [lessonId, input.title],
    );
    const exerciseId = rows[0]?.id;
    if (exerciseId === undefined)
      throw new Error("INSERT INTO exercises returned no id");
    await insertFiles(client, exerciseId, input.files ?? []);
    return exerciseId;
  });
  return findById(id);
}

export async function update(id: number, changes: UpdateExerciseInput) {
  const found = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: number }>(
      `UPDATE exercises SET title = COALESCE($1, title)
        WHERE id = $2 RETURNING id`,
      [changes.title ?? null, id],
    );
    if (!rows[0]) return false;

    if (changes.files !== undefined) {
      await client.query("DELETE FROM exercise_files WHERE exercise_id = $1", [
        id,
      ]);
      await insertFiles(client, id, changes.files);
    }
    return true;
  });
  if (!found) return null;
  return findById(id);
}

export async function remove(id: number) {
  const { rowCount } = await pool.query("DELETE FROM exercises WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
