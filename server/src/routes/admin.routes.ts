import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { getStats } from "../controllers/stats.controller.js";
import userRoutes from "./user.routes.js";
import categoryRoutes from "./category.routes.js";
import levelRoutes from "./level.routes.js";
import courseRoutes from "./course.routes.js";
import contentRoutes from "./content.routes.js";

const router = express.Router();

// Everything below needs a logged-in admin.
router.use(requireAuth, requireRole("admin"));

router.get("/stats", getStats);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/levels", levelRoutes);
router.use("/courses", courseRoutes);
// Sections, lessons and materials (their paths start with /courses/:id,
// /sections, /lessons and /materials).
router.use(contentRoutes);

export default router;
