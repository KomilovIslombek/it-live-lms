import type { Request, Response } from "express";
import { getDashboardStats } from "../services/stats.service.js";

export async function getStats(_req: Request, res: Response) {
  return res.status(200).json({ stats: await getDashboardStats() });
}
