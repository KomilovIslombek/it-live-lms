import pool from "../db.js";
import type { PoolClient } from "pg";

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
    client.release();
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
