import { Router } from "express";
import { uploadProfileImage } from "../utils/upload.js";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "../controllers/user.controller.js";

const router = Router();

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", uploadProfileImage, createUser);
router.patch("/:id", uploadProfileImage, updateUser);
router.delete("/:id", deleteUser);

export default router;
