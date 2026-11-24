import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { allowAll } from "../middleware/course-access.middleware.js";
import { getStats } from "../controllers/stats.controller.js";
import {
  addCourseMentor,
  enrollCourseStudent,
  listCourseMentors,
  removeCourseMentor,
  unenrollCourseStudent,
} from "../controllers/enrollment.controller.js";
import userRoutes from "./user.routes.js";
import categoryRoutes from "./category.routes.js";
import levelRoutes from "./level.routes.js";
import courseRoutes from "./course.routes.js";
import { createContentRouter } from "./content.routes.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/stats", getStats);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/levels", levelRoutes);
router.use("/courses", courseRoutes);

router.get("/courses/:courseId/mentors", listCourseMentors);
router.post("/courses/:courseId/mentors", addCourseMentor);
router.delete("/courses/:courseId/mentors/:userId", removeCourseMentor);
router.post("/courses/:courseId/students", enrollCourseStudent);
router.delete("/courses/:courseId/students/:userId", unenrollCourseStudent);

router.use(createContentRouter(allowAll));

export default router;
