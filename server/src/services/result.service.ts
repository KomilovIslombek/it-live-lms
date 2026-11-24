import pool from "../db.js";
import { percent } from "./enrollment.service.js";

// Exam results (Natijalar): one row per finished attempt.

export interface AttemptResult {
  id: number;
  exam_id: number;
  exam: string;
  lesson_id: number;
  lesson: string;
  course_id: number;
  course: string;
  user_id: number;
  student: string;
  correct_count: number;
  wrong_count: number;
  score_percent: number;
  passed: boolean;
  started_at: Date;
  finished_at: Date | null;
}

const SELECT_ATTEMPTS = `
  SELECT a.id, a.exam_id, e.title AS exam, l.id AS lesson_id, l.title AS lesson,
    c.id AS course_id, c.title AS course, a.user_id, u.full_name AS student,
    a.correct_count, a.wrong_count, a.passed, a.started_at, a.finished_at
  FROM exam_attempts a
  JOIN exams e ON e.id = a.exam_id
  JOIN lessons l ON l.id = e.lesson_id
  JOIN sections s ON s.id = l.section_id
  JOIN courses c ON c.id = s.course_id
  JOIN users u ON u.id = a.user_id`;

function withScore(rows: Omit<AttemptResult, "score_percent">[]) {
  return rows.map((row) => ({
    ...row,
    score_percent: percent(
      row.correct_count,
      row.correct_count + row.wrong_count,
    ),
  }));
}

// All attempts in one course (for the admin and the course's mentors).
export async function findByCourse(courseId: number) {
  const { rows } = await pool.query<Omit<AttemptResult, "score_percent">>(
    `${SELECT_ATTEMPTS} WHERE c.id = $1 ORDER BY a.id DESC`,
    [courseId],
  );
  return withScore(rows);
}

// All attempts of one student (their own results page).
export async function findByUser(userId: number) {
  const { rows } = await pool.query<Omit<AttemptResult, "score_percent">>(
    `${SELECT_ATTEMPTS} WHERE a.user_id = $1 ORDER BY a.id DESC`,
    [userId],
  );
  return withScore(rows);
}
