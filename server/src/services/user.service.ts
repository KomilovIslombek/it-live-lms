import pool from "../db.js";

interface UserWithPassword {
  id: number;
  email: string;
  full_name: string;
  status: boolean;
  role: string;
  password_hash: string;
}

export async function findUserByEmail(email: string) {
  const { rows } = await pool.query<UserWithPassword>(
    `SELECT u.id, u.email, u.full_name, u.status, 
        r.title AS role, u.password_hash 
        FROM users u 
        JOIN roles r on r.id = u.role_id WHERE u.email = $1`,
    [email],
  );
  return rows[0] ?? null;
}

interface UserWithoutPassword {
  id: number;
  email: string;
  full_name: string;
  status: boolean;
  role: string;
}

export async function findUserById(id: number) {
  const { rows } = await pool.query<UserWithoutPassword>(
    `SELECT u.id, u.email, u.full_name, u.status, 
        r.title AS role 
        FROM users u 
        JOIN roles r on r.id = u.role_id WHERE u.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}
