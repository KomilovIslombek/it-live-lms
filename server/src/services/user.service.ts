import pool from "../db.js";
import bcrypt from "bcryptjs";
import { buildSet } from "../utils/sql.js";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
} from "../schemas/user.schema.js";

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

export async function listUsers({
  role,
  search,
  status,
  page,
  limit,
}: ListUsersQuery) {
  const offset = (page - 1) * limit;
  const queryParams: (string | number | boolean)[] = [];
  const conditions: string[] = [];

  if (role) {
    queryParams.push(role);
    conditions.push(`r.title = $${queryParams.length}`);
  }

  if (search) {
    queryParams.push(`%${search}%`);
    conditions.push(
      `(u.full_name ILIKE $${queryParams.length} OR u.phone ILIKE $${queryParams.length})`,
    );
  }

  if (status !== undefined) {
    queryParams.push(status);
    conditions.push(`u.status = $${queryParams.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const from = `FROM users u JOIN roles r ON r.id = u.role_id ${where}`;

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

export interface UserDetails {
  id: number;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: boolean;
  role: string;
  profile_img: string | null;
  job: string | null;
  experience: number | null;
  website: string | null;
  info: string | null;
  facebook: string | null;
  telegram: string | null;
  linkedin: string | null;
  instagram: string | null;
  github: string | null;
  courses_count: number;
  created_at: Date;
  updated_at: Date;
}

export async function findUserDetailsById(id: number) {
  const { rows } = await pool.query<UserDetails>(
    `SELECT u.id, u.full_name, u.phone, u.email, u.status, r.title AS role,
        u.profile_img, u.job, u.experience, u.website, u.info,
        u.facebook, u.telegram, u.linkedin, u.instagram, u.github,
        (SELECT COUNT(*)::int FROM user_courses uc WHERE uc.user_id = u.id) AS courses_count,
        u.created_at, u.updated_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

const BCRYPT_COST = 12;

export async function createUser(input: CreateUserInput) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);

  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO users (role_id, full_name, phone, email, password_hash, status,
        profile_img, job, experience, website, info,
        facebook, telegram, linkedin, instagram, github)
      SELECT r.id, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      FROM roles r WHERE r.title = $16
      RETURNING id`,
    [
      input.full_name,
      input.phone,
      input.email ?? null,
      passwordHash,
      input.status ?? true,
      input.profile_img ?? null,
      input.job ?? null,
      input.experience ?? null,
      input.website ?? null,
      input.info ?? null,
      input.facebook ?? null,
      input.telegram ?? null,
      input.linkedin ?? null,
      input.instagram ?? null,
      input.github ?? null,
      input.role,
    ],
  );
  const id = rows[0]?.id;
  if (id === undefined) throw new Error(`Role "${input.role}" not found`);
  return findUserDetailsById(id);
}

export async function updateUser(id: number, changes: UpdateUserInput) {
  const { password, role, ...columns } = changes;
  const set: Record<string, unknown> = { ...columns };

  if (password !== undefined) {
    set.password_hash = await bcrypt.hash(password, BCRYPT_COST);
  }
  if (role !== undefined) {
    const { rows } = await pool.query<{ id: number }>(
      "SELECT id FROM roles WHERE title = $1",
      [role],
    );
    if (!rows[0]) throw new Error(`Role "${role}" not found`);
    set.role_id = rows[0].id;
  }

  const { set: setSql, values } = buildSet(set);
  const { rows } = await pool.query<{ id: number }>(
    `UPDATE users SET ${setSql} WHERE id = $${values.length + 1} RETURNING id`,
    [...values, id],
  );
  if (!rows[0]) return null;
  return findUserDetailsById(id);
}

export async function deleteUser(id: number) {
  const { rowCount } = await pool.query("DELETE FROM users WHERE id = $1", [
    id,
  ]);
  return rowCount === 1;
}
