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

// Course content: course → sections → lessons → materials.
// The pattern: list and create go under the parent
// (/courses/7/sections), everything about one item uses its own id
// (/sections/3). Short URLs, and no need to send the parent's id twice.
// Mounted inside the admin router (admin only).
const router = Router();

router.get("/courses/:courseId/sections", listSections);
router.post("/courses/:courseId/sections", createSection);
router.get("/sections/:id", getSection);
router.patch("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

router.get("/sections/:sectionId/lessons", listLessons);
router.post("/sections/:sectionId/lessons", createLesson);
router.get("/lessons/:id", getLesson);
router.patch("/lessons/:id", updateLesson);
router.delete("/lessons/:id", deleteLesson);

router.get("/lessons/:lessonId/materials", listMaterials);
router.post("/lessons/:lessonId/materials", createMaterial);
router.get("/materials/:id", getMaterial);
router.patch("/materials/:id", updateMaterial);
router.delete("/materials/:id", deleteMaterial);

export default router;
