import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { studentEnrolled as enrolled } from "../middleware/course-access.middleware.js";
import {
  completeLesson,
  getMyCourse,
  getMyExam,
  getMyLesson,
  listMyCourses,
  listMyResults,
  submitAttempt,
  uncompleteLesson,
} from "../controllers/student.controller.js";

const router = express.Router();

router.use(requireAuth, requireRole("student"));

router.get("/courses", listMyCourses);
router.get("/courses/:id", enrolled("course", "id"), getMyCourse);

router.get("/lessons/:id", enrolled("lesson", "id"), getMyLesson);
router.post("/lessons/:id/complete", enrolled("lesson", "id"), completeLesson);
router.delete(
  "/lessons/:id/complete",
  enrolled("lesson", "id"),
  uncompleteLesson,
);

router.get("/exams/:id", enrolled("exam", "id"), getMyExam);
router.post("/exams/:id/attempts", enrolled("exam", "id"), submitAttempt);

router.get("/results", listMyResults);

export default router;
