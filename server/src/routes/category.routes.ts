import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller.js";

// Mounted inside the admin router at /categories, so every route here is
// already behind requireAuth + requireRole("admin").
const router = Router();

router.get("/", listCategories);
router.get("/:id", getCategory);
router.post("/", createCategory);
router.patch("/:id", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
