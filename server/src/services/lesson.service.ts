import pool from "../db.js";
import { buildSet } from "../utils/sql.js";
import { findByLesson as findMaterialsByLesson } from "./material.service.js";
import type {
  CreateLessonInput,
  UpdateLessonInput,
} from "../schemas/content.schema.js";

export interface Lesson {
  id: number;
  section_id: number;
  course_id: number;
  title: string;
  description: string;
  video_url: string | null;
  position: number;
  materials_count: number;
  created_at: Date;
  updated_at: Date;
}

const SELECT_LESSON = `
  SELECT l.id, l.section_id, s.course_id, l.title, l.description,
    l.video_url, l.position,
    (SELECT COUNT(*)::int FROM materials m WHERE m.lesson_id = l.id) AS materials_count,
    l.created_at, l.updated_at
  FROM lessons l
  JOIN sections s ON s.id = l.section_id`;

export async function findBySection(sectionId: number) {
  const { rows } = await pool.query<Lesson>(
    `${SELECT_LESSON} WHERE l.section_id = $1 ORDER BY l.position, l.id`,
    [sectionId],
  );
  return rows;
}

export async function findById(id: number) {
  const { rows } = await pool.query<Lesson>(
    `${SELECT_LESSON} WHERE l.id = $1`,
    [id],
  );
  const lesson = rows[0];
  if (!lesson) return null;
  return { ...lesson, materials: await findMaterialsByLesson(id) };
}

export async function insert(sectionId: number, input: CreateLessonInput) {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO lessons (section_id, title, description, video_url, position)
      VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      sectionId,
      input.title,
      input.description,
      input.video_url ?? null,
      input.position ?? 0,
    ],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error("INSERT INTO lessons returned no id");
  return findById(id);
}

export async function update(id: number, changes: UpdateLessonInput) {
  const { set, values } = buildSet(changes);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE lessons SET ${set} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findById(id);
}

export async function remove(id: number) {
  const { rowCount } = await pool.query("DELETE FROM lessons WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
