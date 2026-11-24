// Builds the SET part of an UPDATE from only the fields that were sent, so
// PATCH can change one field without touching the others.
//
//   buildSet({ title: "React", status: false })
//   → { set: "title = $1, status = $2", values: ["React", false] }
//
// The column names are put into the SQL text, so they must never come
// straight from the request. Here they are the keys of an object that a zod
// schema already checked, and zod drops every key the schema doesn't know.
// The values still go in as $1, $2, ... like everywhere else.
import pool from "../db.js";
import type { PoolClient } from "pg";

// Does a parent row exist? Used before listing children
// (GET /courses/7/sections → 404 when course 7 doesn't exist).
// The table name is one of these fixed strings, never from the request.
export async function rowExists(
  table: "courses" | "sections" | "lessons" | "materials" | "exams",
  id: number,
) {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM ${table} WHERE id = $1`,
    [id],
  );
  return rowCount === 1;
}

// Runs several queries as one unit: either all of them are saved, or none.
// Example: a material and its files. If the 2nd file fails, the material
// must not stay half-saved. All queries must use the same `client` (one
// connection), because BEGIN/COMMIT belong to a connection, not the pool.
// https://node-postgres.com/features/transactions
export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>,
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release(); // give the connection back to the pool
  }
}

export function buildSet(data: Record<string, unknown>) {
  const columns = Object.keys(data).filter((key) => data[key] !== undefined);

  const set = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");
  const values = columns.map((column) => data[column]);

  return { set, values };
}
