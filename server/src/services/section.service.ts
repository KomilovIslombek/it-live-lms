import pool from "../db.js";
import { buildSet } from "../utils/sql.js";
import type {
  CreateSectionInput,
  UpdateSectionInput,
} from "../schemas/content.schema.js";

export interface Section {
  id: number;
  course_id: number;
  title: string;
  position: number;
  lessons_count: number;
  created_at: Date;
  updated_at: Date;
}

interface LessonInSection {
  id: number;
  title: string;
  video_url: string | null;
  position: number;
}

const SELECT_SECTION = `
  SELECT s.id, s.course_id, s.title, s.position,
    (SELECT COUNT(*)::int FROM lessons l WHERE l.section_id = s.id) AS lessons_count,
    s.created_at, s.updated_at
  FROM sections s`;

export async function findByCourse(courseId: number) {
  const { rows } = await pool.query<Section>(
    `${SELECT_SECTION} WHERE s.course_id = $1 ORDER BY s.position, s.id`,
    [courseId],
  );
  return rows;
}

// One section with its lessons (for the course content tree).
export async function findById(id: number) {
  const [sectionResult, lessonsResult] = await Promise.all([
    pool.query<Section>(`${SELECT_SECTION} WHERE s.id = $1`, [id]),
    pool.query<LessonInSection>(
      `SELECT id, title, video_url, position FROM lessons
        WHERE section_id = $1 ORDER BY position, id`,
      [id],
    ),
  ]);
  const section = sectionResult.rows[0];
  if (!section) return null;
  return { ...section, lessons: lessonsResult.rows };
}

// Throws FOREIGN_KEY_VIOLATION when the course doesn't exist.
export async function insert(courseId: number, input: CreateSectionInput) {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO sections (course_id, title, position)
      VALUES ($1, $2, $3) RETURNING id`,
    [courseId, input.title, input.position ?? 0],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error("INSERT INTO sections returned no id");
  return findById(id);
}

export async function update(id: number, changes: UpdateSectionInput) {
  const { set, values } = buildSet(changes);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE sections SET ${set} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findById(id);
}

// Its lessons, materials, exams... go with it (ON DELETE CASCADE).
export async function remove(id: number) {
  const { rowCount } = await pool.query("DELETE FROM sections WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
