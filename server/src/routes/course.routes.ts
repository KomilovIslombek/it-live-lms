import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from "../controllers/course.controller.js";

// Mounted inside the admin router at /courses (admin only).
const router = Router();

router.get("/", listCourses);
router.get("/:id", getCourse);
router.post("/", createCourse);
router.patch("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
