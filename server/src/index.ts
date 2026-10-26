import express from "express";
import pool from "./db.js";

const app = express();

const PORT: number = Number(process.env.PORT) || 4000;

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    return res.status(200).json({ status: "ok", database: "ok" });
  } catch {
    return res.status(503).json({ status: "ok", database: "unreachable" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
