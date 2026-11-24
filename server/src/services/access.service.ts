import pool from "../db.js";

// Every piece of content belongs to exactly one course:
// course ← section ← lesson ← material / exercise / exam ← question.
export type ContentKind =
  | "course"
  | "section"
  | "lesson"
  | "material"
  | "exercise"
  | "exam"
  | "question";

// For each kind: the SQL that walks up the tree to the course id.
// Fixed strings chosen by `kind`, never text from the request.
const COURSE_ID_OF: Record<ContentKind, string> = {
  course: "SELECT id AS course_id FROM courses WHERE id = $1",
  section: "SELECT course_id FROM sections WHERE id = $1",
  lesson: `SELECT s.course_id FROM lessons l
    JOIN sections s ON s.id = l.section_id WHERE l.id = $1`,
  material: `SELECT s.course_id FROM materials m
    JOIN lessons l ON l.id = m.lesson_id
    JOIN sections s ON s.id = l.section_id WHERE m.id = $1`,
  exercise: `SELECT s.course_id FROM exercises x
    JOIN lessons l ON l.id = x.lesson_id
    JOIN sections s ON s.id = l.section_id WHERE x.id = $1`,
  exam: `SELECT s.course_id FROM exams e
    JOIN lessons l ON l.id = e.lesson_id
    JOIN sections s ON s.id = l.section_id WHERE e.id = $1`,
  question: `SELECT s.course_id FROM exam_questions q
    JOIN exams e ON e.id = q.exam_id
    JOIN lessons l ON l.id = e.lesson_id
    JOIN sections s ON s.id = l.section_id WHERE q.id = $1`,
};

// The course that a section / lesson / exam... belongs to, or null when
// the item doesn't exist.
export async function courseIdOf(kind: ContentKind, id: number) {
  const { rows } = await pool.query<{ course_id: number }>(COURSE_ID_OF[kind], [
    id,
  ]);
  return rows[0]?.course_id ?? null;
}

export async function isCourseMentor(userId: number, courseId: number) {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM course_mentors WHERE user_id = $1 AND course_id = $2",
    [userId, courseId],
  );
  return rowCount === 1;
}

// Enrolled, and the course is switched on (status = true).
export async function isEnrolled(userId: number, courseId: number) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM user_courses uc
      JOIN courses c ON c.id = uc.course_id
      WHERE uc.user_id = $1 AND uc.course_id = $2 AND c.status`,
    [userId, courseId],
  );
  return rowCount === 1;
}
