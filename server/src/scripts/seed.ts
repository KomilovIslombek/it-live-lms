import bcrypt from "bcryptjs";
import pool from "../db.js";

const SEED_ADMIN_PHONE = process.env.SEED_ADMIN_PHONE;
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
if (!SEED_ADMIN_PHONE || !SEED_ADMIN_PASSWORD)
  throw new Error(
    "SEED_ADMIN_PHONE or SEED_ADMIN_PASSWORD is not set. Check server/.env",
  );

const roles = ["admin", "mentor", "assistant", "student"];

for (const role of roles) {
  await pool.query(
    "INSERT INTO roles (title) VALUES ($1) ON CONFLICT (title) DO NOTHING",
    [role],
  );
}
const { rows } = await pool.query<{ id: number }>(
  `SELECT id FROM roles WHERE title = 'admin'`,
);
const adminRoleId = rows[0]?.id;
if (!adminRoleId) {
  throw new Error("role admin id is not set yet src/scripts/seed.ts");
}

const hashedAdminPassword = await bcrypt.hash(SEED_ADMIN_PASSWORD, 12);

const result = await pool.query(
  `INSERT INTO users (role_id, full_name, phone, password_hash) 
    VALUES($1, $2, $3, $4) ON CONFLICT (phone) DO NOTHING`,
  [adminRoleId, "admin", SEED_ADMIN_PHONE, hashedAdminPassword],
);

if (result.rowCount === 1) {
  console.log("Admin was created successfully");
} else {
  console.log("Admin already exists");
}

await pool.end();
