import pool from "../db.js";
import type { ListUsersQuery } from "../schemas/user.schema.js";

interface UserWithPassword {
  id: number;
  phone: string;
  full_name: string;
  status: boolean;
  role: string;
  password_hash: string;
}

export async function findUserByPhone(phone: string) {
  const { rows } = await pool.query<UserWithPassword>(
    `SELECT u.id, u.phone, u.full_name, u.status, 
        r.title AS role, u.password_hash 
        FROM users u 
        JOIN roles r on r.id = u.role_id WHERE u.phone = $1`,
    [phone],
  );
  return rows[0] ?? null;
}

interface UserWithoutPassword {
  id: number;
  phone: string;
  full_name: string;
  status: boolean;
  role: string;
}

export async function findUserById(id: number) {
  const { rows } = await pool.query<UserWithoutPassword>(
    `SELECT u.id, u.phone, u.full_name, u.status, 
        r.title AS role 
        FROM users u 
        JOIN roles r on r.id = u.role_id WHERE u.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

interface UserListItem {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: boolean;
  role: string;
  created_at: Date;
}

export async function listUsers({ role, search, page, limit }: ListUsersQuery) {
  const offset = (page - 1) * limit;
  const queryParams: (string | number)[] = [];
  // Every filter adds one condition; at the end they are joined with AND.
  // So the order and the number of filters never matter.
  const conditions: string[] = [];

  if (role) {
    queryParams.push(role);
    conditions.push(`r.title = $${queryParams.length}`);
  }

  if (search) {
    queryParams.push(`%${search}%`);
    // The same $n twice: one value, used for the name and for the phone.
    conditions.push(
      `(u.full_name ILIKE $${queryParams.length} OR u.phone ILIKE $${queryParams.length})`,
    );
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const from = `FROM users u JOIN roles r ON r.id = u.role_id ${where}`;

  // The page and the total are independent, so run them at the same time.
  // The count uses the same WHERE and params, but no LIMIT/OFFSET.
  const [pageResult, countResult] = await Promise.all([
    pool.query<UserListItem>(
      `SELECT u.id, u.full_name, u.phone, u.email, u.status,
          r.title AS role, u.created_at
        ${from}
        ORDER BY u.id DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
      [...queryParams, limit, offset],
    ),
    pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total ${from}`,
      queryParams,
    ),
  ]);

  return {
    users: pageResult.rows,
    total: countResult.rows[0]?.total ?? 0,
  };
}
