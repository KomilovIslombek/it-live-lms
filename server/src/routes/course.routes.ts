import { Router } from "express";
import { uploadCourseMedia } from "../utils/upload.js";
import {
  createCourse,
  deleteCourse,
  getCourse,
  listCourses,
  updateCourse,
} from "../controllers/course.controller.js";

const router = Router();

router.get("/", listCourses);
router.get("/:id", getCourse);
router.post("/", uploadCourseMedia, createCourse);
router.patch("/:id", uploadCourseMedia, updateCourse);
router.delete("/:id", deleteCourse);

export default router;
