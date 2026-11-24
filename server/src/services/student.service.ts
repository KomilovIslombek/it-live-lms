import pool from "../db.js";
import { findById as findLesson } from "./lesson.service.js";
import { findByLesson as findExercises } from "./exercise.service.js";
import { percent } from "./enrollment.service.js";
import type { SubmitAttemptInput } from "../schemas/content.schema.js";

// The student's side: my courses, a course's lessons with my progress,
// one lesson, exams and my results. The guard (studentEnrolled) has
// already checked that the student is enrolled in the course.

interface MyCourseRow {
  id: number;
  title: string;
  description: string;
  banner: string;
  category: string;
  level: string;
  enrolled_at: Date;
  lessons_done: number;
  lessons_total: number;
}

// Lessons in a course, and the ones this student has marked as done.
const LESSONS_TOTAL = `(SELECT COUNT(*)::int FROM lessons ls
    JOIN sections s ON s.id = ls.section_id
    WHERE s.course_id = c.id)`;
const LESSONS_DONE = `(SELECT COUNT(*)::int FROM lesson_progress lp
    JOIN lessons ls ON ls.id = lp.lesson_id
    JOIN sections s ON s.id = ls.section_id
    WHERE s.course_id = c.id AND lp.user_id = $1)`;

// GET /student/courses: enrolled, switched-on courses, newest first.
export async function findMyCourses(userId: number) {
  const { rows } = await pool.query<MyCourseRow>(
    `SELECT c.id, c.title, c.description, c.banner,
        cat.title AS category, l.title AS level, uc.created_at AS enrolled_at,
        ${LESSONS_DONE} AS lessons_done, ${LESSONS_TOTAL} AS lessons_total
      FROM user_courses uc
      JOIN courses c ON c.id = uc.course_id
      JOIN categories cat ON cat.id = c.category_id
      JOIN levels l ON l.id = c.level_id
      WHERE uc.user_id = $1 AND c.status
      ORDER BY uc.created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    ...row,
    progress_percent: percent(row.lessons_done, row.lessons_total),
  }));
}

interface LessonRow {
  id: number;
  section_id: number;
  title: string;
  video_url: string | null;
  position: number;
  completed: boolean;
}

// GET /student/courses/:id: the course, its sections, and in each section
// its lessons with a `completed` flag for this student.
export async function findMyCourse(courseId: number, userId: number) {
  const [courseResult, sectionsResult, lessonsResult] = await Promise.all([
    pool.query<MyCourseRow>(
      `SELECT c.id, c.title, c.description, c.banner, c.intro_video,
          cat.title AS category, l.title AS level, uc.created_at AS enrolled_at,
          ${LESSONS_DONE} AS lessons_done, ${LESSONS_TOTAL} AS lessons_total
        FROM courses c
        JOIN user_courses uc ON uc.course_id = c.id AND uc.user_id = $1
        JOIN categories cat ON cat.id = c.category_id
        JOIN levels l ON l.id = c.level_id
        WHERE c.id = $2`,
      [userId, courseId],
    ),
    pool.query<{ id: number; title: string; position: number }>(
      `SELECT id, title, position FROM sections
        WHERE course_id = $1 ORDER BY position, id`,
      [courseId],
    ),
    // EXISTS(...) is true when a lesson_progress row is there.
    pool.query<LessonRow>(
      `SELECT ls.id, ls.section_id, ls.title, ls.video_url, ls.position,
          EXISTS (SELECT 1 FROM lesson_progress lp
            WHERE lp.lesson_id = ls.id AND lp.user_id = $2) AS completed
        FROM lessons ls
        JOIN sections s ON s.id = ls.section_id
        WHERE s.course_id = $1
        ORDER BY ls.position, ls.id`,
      [courseId, userId],
    ),
  ]);

  const course = courseResult.rows[0];
  if (!course) return null;

  // Put each lesson into its section (one query each, joined here in JS).
  const sections = sectionsResult.rows.map((section) => ({
    ...section,
    lessons: lessonsResult.rows.filter((l) => l.section_id === section.id),
  }));

  return {
    ...course,
    progress_percent: percent(course.lessons_done, course.lessons_total),
    sections,
  };
}

// GET /student/lessons/:id: video, materials, exercises, exams (without
// answers) and whether I finished it.
export async function findMyLesson(lessonId: number, userId: number) {
  const lesson = await findLesson(lessonId);
  if (!lesson) return null;

  const [exercises, examsResult, progressResult] = await Promise.all([
    findExercises(lessonId),
    pool.query<{
      id: number;
      title: string;
      pass_percent: number;
      questions_count: number;
      my_attempts: number;
      passed: boolean;
    }>(
      `SELECT e.id, e.title, e.pass_percent,
          (SELECT COUNT(*)::int FROM exam_questions q WHERE q.exam_id = e.id) AS questions_count,
          (SELECT COUNT(*)::int FROM exam_attempts a
            WHERE a.exam_id = e.id AND a.user_id = $2) AS my_attempts,
          EXISTS (SELECT 1 FROM exam_attempts a
            WHERE a.exam_id = e.id AND a.user_id = $2 AND a.passed) AS passed
        FROM exams e WHERE e.lesson_id = $1 ORDER BY e.id`,
      [lessonId, userId],
    ),
    pool.query<{ completed_at: Date }>(
      "SELECT completed_at FROM lesson_progress WHERE lesson_id = $1 AND user_id = $2",
      [lessonId, userId],
    ),
  ]);

  return {
    ...lesson,
    exercises,
    exams: examsResult.rows,
    completed: progressResult.rows.length > 0,
    completed_at: progressResult.rows[0]?.completed_at ?? null,
  };
}

// POST /student/lessons/:id/complete. ON CONFLICT DO NOTHING: marking a
// lesson twice is fine (the UNIQUE (user_id, lesson_id) keeps one row).
export async function completeLesson(lessonId: number, userId: number) {
  await pool.query(
    `INSERT INTO lesson_progress (user_id, lesson_id) VALUES ($1, $2)
      ON CONFLICT (user_id, lesson_id) DO NOTHING`,
    [userId, lessonId],
  );
}

// DELETE /student/lessons/:id/complete: "not done yet" again.
export async function uncompleteLesson(lessonId: number, userId: number) {
  await pool.query(
    "DELETE FROM lesson_progress WHERE lesson_id = $1 AND user_id = $2",
    [lessonId, userId],
  );
}

// GET /student/exams/:id: the questions WITHOUT correct_answer.
export async function findExamForStudent(examId: number, userId: number) {
  const [examResult, questionsResult] = await Promise.all([
    pool.query<{
      id: number;
      lesson_id: number;
      title: string;
      pass_percent: number;
      my_attempts: number;
    }>(
      `SELECT e.id, e.lesson_id, e.title, e.pass_percent,
          (SELECT COUNT(*)::int FROM exam_attempts a
            WHERE a.exam_id = e.id AND a.user_id = $2) AS my_attempts
        FROM exams e WHERE e.id = $1`,
      [examId, userId],
    ),
    pool.query(
      `SELECT id, question, answer_a, answer_b, answer_c, answer_d, position
        FROM exam_questions WHERE exam_id = $1 ORDER BY position, id`,
      [examId],
    ),
  ]);
  const exam = examResult.rows[0];
  if (!exam) return null;
  return { ...exam, questions: questionsResult.rows };
}

// POST /student/exams/:id/attempts. The score is counted HERE, on the
// server, with the correct answers from the database: the browser never
// sees them, so it can't send "I got 100%".
// Returns null when the exam doesn't exist, "no-questions" when it's empty.
export async function submitAttempt(
  examId: number,
  userId: number,
  input: SubmitAttemptInput,
) {
  const [examResult, questionsResult] = await Promise.all([
    pool.query<{ pass_percent: number }>(
      "SELECT pass_percent FROM exams WHERE id = $1",
      [examId],
    ),
    pool.query<{ id: number; correct_answer: string }>(
      "SELECT id, correct_answer FROM exam_questions WHERE exam_id = $1",
      [examId],
    ),
  ]);
  const exam = examResult.rows[0];
  if (!exam) return null;
  const questions = questionsResult.rows;
  if (questions.length === 0) return "no-questions" as const;

  // question id → the student's letter. Answers to questions of another
  // exam are simply never looked up.
  const given = new Map(input.answers.map((a) => [a.question_id, a.answer]));
  const correct = questions.filter(
    (q) => given.get(q.id) === q.correct_answer,
  ).length;
  const wrong = questions.length - correct; // unanswered counts as wrong
  const score = percent(correct, questions.length);
  const passed = score >= exam.pass_percent;

  const { rows } = await pool.query<{
    id: number;
    started_at: Date;
    finished_at: Date;
  }>(
    `INSERT INTO exam_attempts (exam_id, user_id, correct_count, wrong_count, passed, finished_at)
      VALUES ($1, $2, $3, $4, $5, now())
      RETURNING id, started_at, finished_at`,
    [examId, userId, correct, wrong, passed],
  );
  const attempt = rows[0];
  if (!attempt) throw new Error("INSERT INTO exam_attempts returned no row");

  return {
    id: attempt.id,
    exam_id: examId,
    correct_count: correct,
    wrong_count: wrong,
    total: questions.length,
    score_percent: score,
    pass_percent: exam.pass_percent,
    passed,
    started_at: attempt.started_at,
    finished_at: attempt.finished_at,
  };
}
