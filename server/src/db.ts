import pg from "pg";
import { logError } from "./utils/logger.js";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL)
  throw new Error("DATABASE_URL is not set. Check server/.env");

const pool = new Pool({ connectionString: DATABASE_URL });

pool.on("error", (err) => {
  logError("Idle PostgreSQL client error", err);
});

export default pool;
