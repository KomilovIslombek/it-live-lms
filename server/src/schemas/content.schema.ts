import { z } from "zod";

// Course content: course → sections → lessons → materials (+ files).
// position orders items inside their parent (0, 1, 2...); ties are
// broken by id, so the order is always stable.
const position = z.number().int().min(0).max(100000);

// --- Sections (Bo'limlar) ---
export const createSectionSchema = z.object({
  title: z.string().trim().min(1).max(255),
  position: position.optional(),
});
export const updateSectionSchema = createSectionSchema.partial();

// --- Lessons (Darslar) ---
export const createLessonSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  video_url: z.string().trim().max(255).nullable().optional(),
  position: position.optional(),
});
export const updateLessonSchema = createLessonSchema.partial();

// --- Materials (Materiallar) ---
// Files are links for now (file_path = a URL or a path). Real uploads come
// later and will fill the same columns.
const materialFileSchema = z.object({
  file_name: z.string().trim().min(1),
  file_path: z.string().trim().min(1),
  mime_type: z.string().trim().max(255).nullable().optional(),
  // Bytes. The column is INTEGER, so at most 2 147 483 647 (~2 GB); a bigger
  // number would fail in the database (500) instead of here (400).
  file_size: z.number().int().min(0).max(2147483647).nullable().optional(),
});

export const createMaterialSchema = z.object({
  description: z.string().trim().min(1),
  files: z.array(materialFileSchema).max(20).optional(),
});
// PATCH: a new description, and/or `files`, which replaces the whole list.
export const updateMaterialSchema = createMaterialSchema.partial();

// --- Exercises (Vazifalar): a homework task with attached files ---
export const createExerciseSchema = z.object({
  title: z.string().trim().min(1),
  files: z.array(materialFileSchema).max(20).optional(),
});
export const updateExerciseSchema = createExerciseSchema.partial();

// --- Exams (Imtihonlar) and their questions ---
export const createExamSchema = z.object({
  title: z.string().trim().min(1).max(255),
  // Passing score in percent; the database default is 60.
  pass_percent: z.number().int().min(0).max(100).optional(),
});
export const updateExamSchema = createExamSchema.partial();

const answerLetter = z.enum(["a", "b", "c", "d"]);

// A test question with four answers, one of them correct.
export const createQuestionSchema = z.object({
  question: z.string().trim().min(1),
  answer_a: z.string().trim().min(1).max(255),
  answer_b: z.string().trim().min(1).max(255),
  answer_c: z.string().trim().min(1).max(255),
  answer_d: z.string().trim().min(1).max(255),
  correct_answer: answerLetter,
  position: position.optional(),
});
export const updateQuestionSchema = createQuestionSchema.partial();

// POST /student/exams/:id/attempts
// { "answers": [{ "question_id": 5, "answer": "b" }, ...] }
// A question left out counts as wrong.
export const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        question_id: z.number().int().positive(),
        answer: answerLetter,
      }),
    )
    .max(500),
});

// --- Enrollment: POST /admin/courses/:courseId/students (or /mentors) ---
export const courseMemberSchema = z.object({
  user_id: z.number().int().positive().max(2147483647),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type CreateLessonInput = z.infer<typeof createLessonSchema>;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
export type MaterialFileInput = z.infer<typeof materialFileSchema>;
export type CreateMaterialInput = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema>;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
