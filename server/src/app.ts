import express from "express";
import pool from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import mentorRoutes from "./routes/mentor.routes.js";
import studentRoutes from "./routes/student.routes.js";
import cookieParser from "cookie-parser";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({ status: "ok", database: "ok" });
  } catch {
    return res.status(503).json({ status: "ok", database: "unreachable" });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/mentor", mentorRoutes);
app.use("/api/v1/student", studentRoutes);

app.use("/api", notFound);
app.use(errorHandler);

export default app;
