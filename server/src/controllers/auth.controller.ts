import type { Request, Response } from "express";
import { z } from "zod";
import { findUserByEmail } from "../services/user.service.js";
import bcrypt from "bcryptjs";
import { loginSchema } from "../schemas/auth.schema.js";

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request",
      details: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  const comparedPassword = await bcrypt.compare(
    parsed.data.password,
    user.password_hash,
  );

  if (!comparedPassword) {
    return res.status(401).json({
      error: "Invalid email or password",
    });
  }

  if (!user.status) {
    return res.status(403).json({
      error: "Account is deactivated",
    });
  }

  const { password_hash: _passwordHash, ...safeUser } = user;

  return res.status(200).json({
    user: safeUser,
  });
}
