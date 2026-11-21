import type { Request, Response } from "express";
// The service function has the same name as this controller, so rename it
// on import.
import { listUsers as findUsers } from "../services/user.service.js";
import { listUsersQuerySchema } from "../schemas/user.schema.js";
import { sendValidationError } from "../utils/http.js";

// GET /admin/users?role=student&search=ali&page=1&limit=10
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
