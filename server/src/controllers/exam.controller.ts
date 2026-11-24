import type { Request, Response } from "express";
import * as exams from "../services/exam.service.js";
import {
  createExamSchema,
  createQuestionSchema,
  updateExamSchema,
  updateQuestionSchema,
} from "../schemas/content.schema.js";
import { parseId, sendValidationError } from "../utils/http.js";
import { FOREIGN_KEY_VIOLATION, pgError } from "../utils/pg-errors.js";
import { rowExists } from "../utils/sql.js";

// Exams of a lesson, and the questions of an exam. Same structure as the
// other content controllers.

// GET /lessons/:lessonId/exams
export async function listExams(req: Request, res: Response) {
  const lessonId = parseId(req.params.lessonId);
  if (lessonId === null) return res.status(400).json({ error: "Invalid id" });

  if (!(await rowExists("lessons", lessonId))) {
    return res.status(404).json({ error: "Lesson not found" });
  }
  return res.status(200).json({ exams: await exams.findByLesson(lessonId) });
}

// GET /exams/:id (with its questions and correct answers)
export async function getExam(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const exam = await exams.findById(id);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  return res.status(200).json({ exam });
}

// POST /lessons/:lessonId/exams
export async function createExam(req: Request, res: Response) {
  const lessonId = parseId(req.params.lessonId);
  if (lessonId === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = createExamSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const exam = await exams.insert(lessonId, parsed.data);
    return res.status(201).json({ exam });
  } catch (err) {
    if (pgError(err).code === FOREIGN_KEY_VIOLATION) {
      return res.status(404).json({ error: "Lesson not found" });
    }
    throw err;
  }
}

// PATCH /exams/:id
export async function updateExam(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateExamSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const exam = await exams.update(id, parsed.data);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  return res.status(200).json({ exam });
}

// DELETE /exams/:id
export async function deleteExam(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const deleted = await exams.remove(id);
  if (!deleted) return res.status(404).json({ error: "Exam not found" });
  return res.status(204).end();
}

// --- Questions ---

// GET /exams/:examId/questions
export async function listQuestions(req: Request, res: Response) {
  const examId = parseId(req.params.examId);
  if (examId === null) return res.status(400).json({ error: "Invalid id" });

  if (!(await rowExists("exams", examId))) {
    return res.status(404).json({ error: "Exam not found" });
  }
  return res.status(200).json({ questions: await exams.findQuestions(examId) });
}

// GET /questions/:id
export async function getQuestion(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const question = await exams.findQuestionById(id);
  if (!question) return res.status(404).json({ error: "Question not found" });
  return res.status(200).json({ question });
}

// POST /exams/:examId/questions
export async function createQuestion(req: Request, res: Response) {
  const examId = parseId(req.params.examId);
  if (examId === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = createQuestionSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const question = await exams.insertQuestion(examId, parsed.data);
    return res.status(201).json({ question });
  } catch (err) {
    if (pgError(err).code === FOREIGN_KEY_VIOLATION) {
      return res.status(404).json({ error: "Exam not found" });
    }
    throw err;
  }
}

// PATCH /questions/:id
export async function updateQuestion(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateQuestionSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const question = await exams.updateQuestion(id, parsed.data);
  if (!question) return res.status(404).json({ error: "Question not found" });
  return res.status(200).json({ question });
}

// DELETE /questions/:id
export async function deleteQuestion(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const deleted = await exams.removeQuestion(id);
  if (!deleted) return res.status(404).json({ error: "Question not found" });
  return res.status(204).end();
}
