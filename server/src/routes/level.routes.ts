import { Router } from "express";
import {
  createLevel,
  deleteLevel,
  getLevel,
  listLevels,
  updateLevel,
} from "../controllers/level.controller.js";

const router = Router();

router.get("/", listLevels);
router.get("/:id", getLevel);
router.post("/", createLevel);
router.patch("/:id", updateLevel);
router.delete("/:id", deleteLevel);

export default router;
