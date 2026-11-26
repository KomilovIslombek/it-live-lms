import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import pool from "./db.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import mentorRoutes from "./routes/mentor.routes.js";
import studentRoutes from "./routes/student.routes.js";
import cookieParser from "cookie-parser";
import { errorHandler, notFound } from "./middleware/error.middleware.js";
import { UPLOAD_DIR } from "./utils/upload.js";
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

app.use(
  "/uploads",
  express.static(UPLOAD_DIR, {
    index: false,
    dotfiles: "deny",
    setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff"),
  }),
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/mentor", mentorRoutes);
app.use("/api/v1/student", studentRoutes);

app.use("/api", notFound);

const CLIENT_DIR = fileURLToPath(
  new URL("../../client/dist/", import.meta.url),
);
if (process.env.NODE_ENV === "production" && existsSync(CLIENT_DIR)) {
  app.use(express.static(CLIENT_DIR, { index: false }));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/uploads/")) return next();
    return res.sendFile("index.html", { root: CLIENT_DIR });
  });
}

app.use(errorHandler);

export default app;
