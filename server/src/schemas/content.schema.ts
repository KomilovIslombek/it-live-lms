import { z } from "zod";
import { formNumber } from "./common.schema.js";

const position = formNumber(z.number().int().min(0).max(100000));

export const createSectionSchema = z.object({
  title: z.string().trim().min(1).max(255),
  position: position.optional(),
});
export const updateSectionSchema = createSectionSchema.partial();

export const createLessonSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().min(1),
  position: position.optional(),
});
export const updateLessonSchema = createLessonSchema.partial();

const materialFileSchema = z.object({
  file_name: z.string().trim().min(1),
  file_path: z.string().trim().min(1),
  mime_type: z.string().trim().max(255).nullable().optional(),
  file_size: z.number().int().min(0).max(2147483647).nullable().optional(),
});

export const createMaterialSchema = z.object({
  description: z.string().trim().min(1),
});
export const updateMaterialSchema = createMaterialSchema.partial();

export const createExerciseSchema = z.object({
  title: z.string().trim().min(1),
});
export const updateExerciseSchema = createExerciseSchema.partial();

export const createExamSchema = z.object({
  title: z.string().trim().min(1).max(255),
  pass_percent: z.number().int().min(0).max(100).optional(),
});
export const updateExamSchema = createExamSchema.partial();

const answerLetter = z.enum(["a", "b", "c", "d"]);

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

export const courseMemberSchema = z.object({
  user_id: z.number().int().positive().max(2147483647),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
type WithVideo = { video_url?: string | null };
export type CreateLessonInput = z.infer<typeof createLessonSchema> & WithVideo;
export type UpdateLessonInput = z.infer<typeof updateLessonSchema> & WithVideo;
export type MaterialFileInput = z.infer<typeof materialFileSchema>;
type WithFiles = { files?: MaterialFileInput[] };
export type CreateMaterialInput = z.infer<typeof createMaterialSchema> &
  WithFiles;
export type UpdateMaterialInput = z.infer<typeof updateMaterialSchema> &
  WithFiles;
export type CreateExerciseInput = z.infer<typeof createExerciseSchema> &
  WithFiles;
export type UpdateExerciseInput = z.infer<typeof updateExerciseSchema> &
  WithFiles;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type UpdateExamInput = z.infer<typeof updateExamSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
