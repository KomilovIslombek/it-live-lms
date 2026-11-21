import pool from "../db.js";
import { buildSet } from "../utils/sql.js";
import type {
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from "../schemas/course.schema.js";

// price is NUMERIC in the database, and node-postgres returns NUMERIC as a
// string ("1200000.00") so no precision is lost. We keep it a string.
export interface CourseListItem {
  id: number;
  title: string;
  price: string;
  banner: string;
  status: boolean;
  category_id: number;
  category: string;
  level_id: number;
  level: string;
  students_count: number;
  created_at: Date;
}

export interface Course extends CourseListItem {
  description: string;
  intro_video: string | null;
  updated_at: Date;
}

// The same WHERE for the page of courses and for the total count.
// "$1::text IS NULL OR ..." makes a filter optional: when the admin didn't
// send it we pass null, the left side is true, and the filter is skipped.
// The ::text / ::int casts tell PostgreSQL the type of a null parameter.
const LIST_WHERE = `
  WHERE ($1::text IS NULL OR c.title ILIKE $1)
    AND ($2::int IS NULL OR c.category_id = $2)
    AND ($3::int IS NULL OR c.level_id = $3)
    AND ($4::boolean IS NULL OR c.status = $4)`;

export async function findPage(query: ListCoursesQuery) {
  const { search, category_id, level_id, status, page, limit } = query;
  // ILIKE = LIKE without caring about upper/lower case; % = anything.
  const filters = [
    search ? `%${search}%` : null,
    category_id ?? null,
    level_id ?? null,
    status ?? null,
  ];
  const offset = (page - 1) * limit;

  // Two independent queries, so run them at the same time.
  const [pageResult, countResult] = await Promise.all([
    pool.query<CourseListItem>(
      `SELECT c.id, c.title, c.price, c.banner, c.status,
          c.category_id, cat.title AS category,
          c.level_id, l.title AS level,
          (SELECT COUNT(*)::int FROM user_courses uc WHERE uc.course_id = c.id) AS students_count,
          c.created_at
        FROM courses c
        JOIN categories cat ON cat.id = c.category_id
        JOIN levels l ON l.id = c.level_id
        ${LIST_WHERE}
        ORDER BY c.id DESC
        LIMIT $5 OFFSET $6`,
      [...filters, limit, offset],
    ),
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM courses c ${LIST_WHERE}`,
      filters,
    ),
  ]);

  return {
    courses: pageResult.rows,
    total: countResult.rows[0]?.total ?? 0,
  };
}

export async function findById(id: number) {
  const { rows } = await pool.query<Course>(
    `SELECT c.id, c.title, c.description, c.price, c.banner, c.intro_video,
        c.status, c.category_id, cat.title AS category,
        c.level_id, l.title AS level,
        (SELECT COUNT(*)::int FROM user_courses uc WHERE uc.course_id = c.id) AS students_count,
        c.created_at, c.updated_at
      FROM courses c
      JOIN categories cat ON cat.id = c.category_id
      JOIN levels l ON l.id = c.level_id
      WHERE c.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

// Throws FOREIGN_KEY_VIOLATION when category_id or level_id doesn't exist.
export async function insert(course: CreateCourseInput) {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO courses
        (title, description, price, banner, intro_video, category_id, level_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
    [
      course.title,
      course.description,
      course.price,
      course.banner,
      course.intro_video ?? null,
      course.category_id,
      course.level_id,
      course.status ?? true,
    ],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error("INSERT INTO courses returned no id");
  return findById(id);
}

// Returns null when there is no course with this id.
export async function update(id: number, changes: UpdateCourseInput) {
  const { set, values } = buildSet(changes);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE courses SET ${set} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findById(id);
}

// Deleting a course also deletes its enrollments and its whole content tree
// (sections → lessons → materials...: ON DELETE CASCADE). It throws
// RESTRICT_VIOLATION when the course has payments (ON DELETE RESTRICT).
export async function remove(id: number) {
  const { rowCount } = await pool.query("DELETE FROM courses WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
