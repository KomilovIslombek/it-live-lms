import pool from "../db.js";
import { buildSet } from "../utils/sql.js";
import type {
  CreateExamInput,
  CreateQuestionInput,
  UpdateExamInput,
  UpdateQuestionInput,
} from "../schemas/content.schema.js";

export interface Exam {
  id: number;
  lesson_id: number;
  title: string;
  pass_percent: number;
  questions_count: number;
  attempts_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Question {
  id: number;
  exam_id: number;
  question: string;
  answer_a: string;
  answer_b: string;
  answer_c: string;
  answer_d: string;
  correct_answer: "a" | "b" | "c" | "d";
  position: number;
  created_at: Date;
  updated_at: Date;
}

const SELECT_EXAM = `
  SELECT e.id, e.lesson_id, e.title, e.pass_percent,
    (SELECT COUNT(*)::int FROM exam_questions q WHERE q.exam_id = e.id) AS questions_count,
    (SELECT COUNT(*)::int FROM exam_attempts a WHERE a.exam_id = e.id) AS attempts_count,
    e.created_at, e.updated_at
  FROM exams e`;

const SELECT_QUESTION = `
  SELECT id, exam_id, question, answer_a, answer_b, answer_c, answer_d,
    correct_answer, position, created_at, updated_at
  FROM exam_questions`;

export async function findByLesson(lessonId: number) {
  const { rows } = await pool.query<Exam>(
    `${SELECT_EXAM} WHERE e.lesson_id = $1 ORDER BY e.id`,
    [lessonId],
  );
  return rows;
}

export async function findQuestions(examId: number) {
  const { rows } = await pool.query<Question>(
    `${SELECT_QUESTION} WHERE exam_id = $1 ORDER BY position, id`,
    [examId],
  );
  return rows;
}

export async function findById(id: number) {
  const [examResult, questions] = await Promise.all([
    pool.query<Exam>(`${SELECT_EXAM} WHERE e.id = $1`, [id]),
    findQuestions(id),
  ]);
  const exam = examResult.rows[0];
  if (!exam) return null;
  return { ...exam, questions };
}

export async function insert(lessonId: number, input: CreateExamInput) {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO exams (lesson_id, title, pass_percent)
      VALUES ($1, $2, COALESCE($3, 60)) RETURNING id`,
    [lessonId, input.title, input.pass_percent ?? null],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error("INSERT INTO exams returned no id");
  return findById(id);
}

export async function update(id: number, changes: UpdateExamInput) {
  const { set, values } = buildSet(changes);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE exams SET ${set} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findById(id);
}

export async function remove(id: number) {
  const { rowCount } = await pool.query("DELETE FROM exams WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}

export async function findQuestionById(id: number) {
  const { rows } = await pool.query<Question>(
    `${SELECT_QUESTION} WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function insertQuestion(
  examId: number,
  input: CreateQuestionInput,
) {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO exam_questions
        (exam_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, position)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [
      examId,
      input.question,
      input.answer_a,
      input.answer_b,
      input.answer_c,
      input.answer_d,
      input.correct_answer,
      input.position ?? 0,
    ],
  );
  const id = rows[0]?.id;
  if (id === undefined)
    throw new Error("INSERT INTO exam_questions returned no id");
  return findQuestionById(id);
}

export async function updateQuestion(id: number, changes: UpdateQuestionInput) {
  const { set, values } = buildSet(changes);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE exam_questions SET ${set} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findQuestionById(id);
}

export async function removeQuestion(id: number) {
  const { rowCount } = await pool.query(
    "DELETE FROM exam_questions WHERE id = $1",
    [id],
  );
  return rowCount === 1;
}
