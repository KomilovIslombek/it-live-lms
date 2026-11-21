import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { listUsers } from "../controllers/user.controller.js";
import categoryRoutes from "./category.routes.js";
import levelRoutes from "./level.routes.js";
import courseRoutes from "./course.routes.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));
router.get("/users", listUsers);

router.use("/categories", categoryRoutes);
router.use("/levels", levelRoutes);
router.use("/courses", courseRoutes);

export default router;
