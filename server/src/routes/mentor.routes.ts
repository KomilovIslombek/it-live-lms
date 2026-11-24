import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { mentorOwnsCourse } from "../middleware/course-access.middleware.js";
import {
  getMyCourse,
  listMyCourses,
} from "../controllers/mentor.controller.js";
import { createContentRouter } from "./content.routes.js";

// /api/v1/mentor: the mentor's panel.
const router = express.Router();

router.use(requireAuth, requireRole("mentor"));

router.get("/courses", listMyCourses);
router.get("/courses/:id", mentorOwnsCourse("course", "id"), getMyCourse);

// The same content routes as the admin's (sections, lessons, materials,
// exercises, exams, questions, students, results), but every request is
// checked first: the item must belong to one of this mentor's courses,
// otherwise 403. Mentors can't create courses, change users or enroll
// students: that stays with the admin.
router.use(createContentRouter(mentorOwnsCourse));

export default router;
