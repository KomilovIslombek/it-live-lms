import type { Request, Response } from "express";
// The service function has the same name as this controller, so rename it
// on import.
import {
  createUser as insertUser,
  deleteUser as removeUser,
  findUserDetailsById,
  listUsers as findUsers,
  updateUser as changeUser,
} from "../services/user.service.js";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "../schemas/user.schema.js";
import { parseId, sendValidationError } from "../utils/http.js";
import {
  UNIQUE_VIOLATION,
  isStillReferenced,
  pgError,
} from "../utils/pg-errors.js";

// The phone and the email are UNIQUE in the database. When one is taken,
// PostgreSQL names the constraint, so we can say which field it was.
// Returns false when the error is something else (the caller rethrows it).
function sendTaken(res: Response, err: unknown) {
  const { code, constraint } = pgError(err);
  if (code !== UNIQUE_VIOLATION) return false;

  const field = constraint === "users_email_unique" ? "email" : "phone";
  res.status(409).json({
    error: `This ${field} is already used by another user`,
    details: { [field]: ["Already in use"] },
  });
  return true;
}

// Is this request about the admin's own account? (req.user.sub is the id
// from the token, a string.)
function isSelf(req: Request, id: number) {
  return req.user?.sub === String(id);
}

// GET /admin/users?role=student&search=ali&status=true&page=1&limit=10
export async function listUsers(req: Request, res: Response) {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const { users, total } = await findUsers(parsed.data);

  return res.status(200).json({
    users,
    page: parsed.data.page,
    limit: parsed.data.limit,
    total,
  });
}

// GET /admin/users/:id
export async function getUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const user = await findUserDetailsById(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.status(200).json({ user });
}

// POST /admin/users
export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const user = await insertUser(parsed.data);
    return res.status(201).json({ user });
  } catch (err) {
    if (sendTaken(res, err)) return;
    throw err;
  }
}

// PATCH /admin/users/:id (also activate / deactivate: { "status": false })
export async function updateUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (Object.keys(parsed.data).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  // An admin who switches themselves off or demotes themselves is locked
  // out of the admin panel at once, and there may be no admin left.
  if (isSelf(req, id)) {
    if (parsed.data.status === false) {
      return res
        .status(400)
        .json({ error: "You can't deactivate your own account" });
    }
    if (parsed.data.role !== undefined && parsed.data.role !== "admin") {
      return res.status(400).json({ error: "You can't change your own role" });
    }
  }

  try {
    const user = await changeUser(id, parsed.data);
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ user });
  } catch (err) {
    if (sendTaken(res, err)) return;
    throw err;
  }
}

// DELETE /admin/users/:id
export async function deleteUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  if (isSelf(req, id)) {
    return res.status(400).json({ error: "You can't delete your own account" });
  }

  try {
    const deleted = await removeUser(id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    return res.status(204).end();
  } catch (err) {
    // Payments are money records: ON DELETE RESTRICT keeps them.
    if (isStillReferenced(err)) {
      return res.status(409).json({
        error: "This user has payments. Set status: false instead",
      });
    }
    throw err;
  }
}
