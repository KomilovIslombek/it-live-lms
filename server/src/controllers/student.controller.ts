import type { Request, Response } from "express";
import * as student from "../services/student.service.js";
import { findByUser as findMyResults } from "../services/result.service.js";
import { submitAttemptSchema } from "../schemas/content.schema.js";
import { parseId, sendValidationError } from "../utils/http.js";

// The student's own id, from the token (requireAuth put it there).
const me = (req: Request) => Number(req.user?.sub);

// GET /student/courses
export async function listMyCourses(req: Request, res: Response) {
  return res
    .status(200)
    .json({ courses: await student.findMyCourses(me(req)) });
}

// GET /student/courses/:id (sections, lessons, my progress)
export async function getMyCourse(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const course = await student.findMyCourse(id, me(req));
  if (!course) return res.status(404).json({ error: "Course not found" });
  return res.status(200).json({ course });
}

// GET /student/lessons/:id
export async function getMyLesson(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const lesson = await student.findMyLesson(id, me(req));
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  return res.status(200).json({ lesson });
}

// POST /student/lessons/:id/complete  and  DELETE (undo)
async function setCompleted(req: Request, res: Response, done: boolean) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const lesson = await student.findMyLesson(id, me(req));
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });

  if (done) await student.completeLesson(id, me(req));
  else await student.uncompleteLesson(id, me(req));

  const updated = await student.findMyLesson(id, me(req));
  return res.status(200).json({
    lesson_id: id,
    completed: updated?.completed ?? done,
    completed_at: updated?.completed_at ?? null,
  });
}

export const completeLesson = (req: Request, res: Response) =>
  setCompleted(req, res, true);
export const uncompleteLesson = (req: Request, res: Response) =>
  setCompleted(req, res, false);

// GET /student/exams/:id (questions without the correct answers)
export async function getMyExam(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const exam = await student.findExamForStudent(id, me(req));
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  return res.status(200).json({ exam });
}

// POST /student/exams/:id/attempts
export async function submitAttempt(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = submitAttemptSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const result = await student.submitAttempt(id, me(req), parsed.data);
  if (result === null) return res.status(404).json({ error: "Exam not found" });
  if (result === "no-questions") {
    return res.status(400).json({ error: "This exam has no questions yet" });
  }
  return res.status(201).json({ attempt: result });
}

// GET /student/results (all my exam attempts)
export async function listMyResults(req: Request, res: Response) {
  return res.status(200).json({ results: await findMyResults(me(req)) });
}
