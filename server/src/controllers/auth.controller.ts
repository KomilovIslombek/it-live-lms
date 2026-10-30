import type { Request, Response } from "express";
import { z } from "zod";
import { findUserByEmail } from "../services/user.service.js";
import bcrypt from "bcryptjs";
import { loginSchema } from "../schemas/auth.schema.js";
import { signToken } from "../utils/jwt.js";

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

  const token = signToken({ sub: String(user.id), role: user.role });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    user: safeUser,
  });
}
