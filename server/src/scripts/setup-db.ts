import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pool from "../db.js";

const SCHEMA_DIR = fileURLToPath(
  new URL("../../../docs/database/", import.meta.url),
);
const SCHEMA_FILES = [
  "drawsql-1-users-courses-payments.sql",
  "drawsql-2-course-content.sql",
  "setup-timezone-and-triggers.sql",
];

const { rows } = await pool.query<{ users: string | null }>(
  "SELECT to_regclass('public.users')::text AS users",
);

if (rows[0]?.users) {
  console.log("Schema is already there");
} else {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const file of SCHEMA_FILES) {
      await client.query(await readFile(path.join(SCHEMA_DIR, file), "utf8"));
    }
    await client.query("COMMIT");
    console.log(`Schema created from ${SCHEMA_FILES.length} files`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

await pool.end();
