import pool from "../db.js";
import { buildSet } from "../utils/sql.js";
import type {
  CreateCourseInput,
  ListCoursesQuery,
  UpdateCourseInput,
} from "../schemas/course.schema.js";

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

const LIST_WHERE = `
  WHERE ($1::text IS NULL OR c.title ILIKE $1)
    AND ($2::int IS NULL OR c.category_id = $2)
    AND ($3::int IS NULL OR c.level_id = $3)
    AND ($4::boolean IS NULL OR c.status = $4)`;

export async function findPage(query: ListCoursesQuery) {
  const { search, category_id, level_id, status, page, limit } = query;
  const filters = [
    search ? `%${search}%` : null,
    category_id ?? null,
    level_id ?? null,
    status ?? null,
  ];
  const offset = (page - 1) * limit;

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

export async function update(id: number, changes: UpdateCourseInput) {
  const { set, values } = buildSet(changes);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE courses SET ${set} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findById(id);
}

export async function remove(id: number) {
  const { rowCount } = await pool.query("DELETE FROM courses WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
