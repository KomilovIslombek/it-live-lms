import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { mentorOwnsCourse } from "../middleware/course-access.middleware.js";
import {
  getMyCourse,
  listMyCourses,
} from "../controllers/mentor.controller.js";
import { createContentRouter } from "./content.routes.js";

const router = express.Router();

router.use(requireAuth, requireRole("mentor"));

router.get("/courses", listMyCourses);
router.get("/courses/:id", mentorOwnsCourse("course", "id"), getMyCourse);

router.use(createContentRouter(mentorOwnsCourse));

export default router;
