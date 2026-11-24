import type { Request, Response } from "express";
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
import { deleteStoredFile, uploadedPath } from "../utils/upload.js";
import {
  deleteStoredFiles,
  storedFilesOf,
} from "../services/stored-files.service.js";
import {
  UNIQUE_VIOLATION,
  isStillReferenced,
  pgError,
} from "../utils/pg-errors.js";

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

function isSelf(req: Request, id: number) {
  return req.user?.sub === String(id);
}

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

export async function getUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const user = await findUserDetailsById(id);
  if (!user) return res.status(404).json({ error: "User not found" });

  return res.status(200).json({ user });
}

export async function createUser(req: Request, res: Response) {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  try {
    const user = await insertUser({
      ...parsed.data,
      profile_img: uploadedPath(req, "profile_img") ?? null,
    });
    return res.status(201).json({ user });
  } catch (err) {
    if (sendTaken(res, err)) return;
    throw err;
  }
}

export async function updateUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const photo = uploadedPath(req, "profile_img");
  const changes = { ...parsed.data, ...(photo ? { profile_img: photo } : {}) };
  if (Object.keys(changes).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

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
    const before = photo ? await findUserDetailsById(id) : null;
    const user = await changeUser(id, changes);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (photo) await deleteStoredFile(before?.profile_img);
    return res.status(200).json({ user });
  } catch (err) {
    if (sendTaken(res, err)) return;
    throw err;
  }
}

export async function deleteUser(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  if (isSelf(req, id)) {
    return res.status(400).json({ error: "You can't delete your own account" });
  }

  try {
    const files = await storedFilesOf("user", id);
    const deleted = await removeUser(id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    await deleteStoredFiles(files);
    return res.status(204).end();
  } catch (err) {
    if (isStillReferenced(err)) {
      return res.status(409).json({
        error: "This user has payments. Set status: false instead",
      });
    }
    throw err;
  }
}
