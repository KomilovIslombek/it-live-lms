import { Router } from "express";
import {
  createSection,
  deleteSection,
  getSection,
  listSections,
  updateSection,
} from "../controllers/section.controller.js";
import {
  createLesson,
  deleteLesson,
  getLesson,
  listLessons,
  updateLesson,
} from "../controllers/lesson.controller.js";
import {
  createMaterial,
  deleteMaterial,
  getMaterial,
  listMaterials,
  updateMaterial,
} from "../controllers/material.controller.js";
import {
  createExercise,
  deleteExercise,
  getExercise,
  listExercises,
  updateExercise,
} from "../controllers/exercise.controller.js";
import {
  createExam,
  createQuestion,
  deleteExam,
  deleteQuestion,
  getExam,
  getQuestion,
  listExams,
  listQuestions,
  updateExam,
  updateQuestion,
} from "../controllers/exam.controller.js";
import {
  listCourseResults,
  listCourseStudents,
} from "../controllers/enrollment.controller.js";
import type { CourseGuard } from "../middleware/course-access.middleware.js";
import { uploadAttachments, uploadLessonVideo } from "../utils/upload.js";

export function createContentRouter(guard: CourseGuard) {
  const router = Router();

  router.get(
    "/courses/:courseId/sections",
    guard("course", "courseId"),
    listSections,
  );
  router.post(
    "/courses/:courseId/sections",
    guard("course", "courseId"),
    createSection,
  );
  router.get("/sections/:id", guard("section", "id"), getSection);
  router.patch("/sections/:id", guard("section", "id"), updateSection);
  router.delete("/sections/:id", guard("section", "id"), deleteSection);

  router.get(
    "/sections/:sectionId/lessons",
    guard("section", "sectionId"),
    listLessons,
  );
  router.post(
    "/sections/:sectionId/lessons",
    guard("section", "sectionId"),
    uploadLessonVideo,
    createLesson,
  );
  router.get("/lessons/:id", guard("lesson", "id"), getLesson);
  router.patch(
    "/lessons/:id",
    guard("lesson", "id"),
    uploadLessonVideo,
    updateLesson,
  );
  router.delete("/lessons/:id", guard("lesson", "id"), deleteLesson);

  router.get(
    "/lessons/:lessonId/materials",
    guard("lesson", "lessonId"),
    listMaterials,
  );
  router.post(
    "/lessons/:lessonId/materials",
    guard("lesson", "lessonId"),
    uploadAttachments,
    createMaterial,
  );
  router.get("/materials/:id", guard("material", "id"), getMaterial);
  router.patch(
    "/materials/:id",
    guard("material", "id"),
    uploadAttachments,
    updateMaterial,
  );
  router.delete("/materials/:id", guard("material", "id"), deleteMaterial);

  router.get(
    "/lessons/:lessonId/exercises",
    guard("lesson", "lessonId"),
    listExercises,
  );
  router.post(
    "/lessons/:lessonId/exercises",
    guard("lesson", "lessonId"),
    uploadAttachments,
    createExercise,
  );
  router.get("/exercises/:id", guard("exercise", "id"), getExercise);
  router.patch(
    "/exercises/:id",
    guard("exercise", "id"),
    uploadAttachments,
    updateExercise,
  );
  router.delete("/exercises/:id", guard("exercise", "id"), deleteExercise);

  router.get(
    "/lessons/:lessonId/exams",
    guard("lesson", "lessonId"),
    listExams,
  );
  router.post(
    "/lessons/:lessonId/exams",
    guard("lesson", "lessonId"),
    createExam,
  );
  router.get("/exams/:id", guard("exam", "id"), getExam);
  router.patch("/exams/:id", guard("exam", "id"), updateExam);
  router.delete("/exams/:id", guard("exam", "id"), deleteExam);

  router.get(
    "/exams/:examId/questions",
    guard("exam", "examId"),
    listQuestions,
  );
  router.post(
    "/exams/:examId/questions",
    guard("exam", "examId"),
    createQuestion,
  );
  router.get("/questions/:id", guard("question", "id"), getQuestion);
  router.patch("/questions/:id", guard("question", "id"), updateQuestion);
  router.delete("/questions/:id", guard("question", "id"), deleteQuestion);

  router.get(
    "/courses/:courseId/students",
    guard("course", "courseId"),
    listCourseStudents,
  );
  router.get(
    "/courses/:courseId/results",
    guard("course", "courseId"),
    listCourseResults,
  );

  return router;
}
