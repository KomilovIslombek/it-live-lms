import type { Request, Response } from "express";
import { findMyCourses } from "../services/mentor.service.js";
import { findById as findCourseById } from "../services/course.service.js";
import { findByCourse as findSections } from "../services/section.service.js";
import { parseId } from "../utils/http.js";

export async function listMyCourses(req: Request, res: Response) {
  const courses = await findMyCourses(Number(req.user?.sub));
  return res.status(200).json({ courses });
}

export async function getMyCourse(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: "Invalid id" });

  const course = await findCourseById(id);
  if (!course) return res.status(404).json({ error: "Course not found" });

  return res
    .status(200)
    .json({ course: { ...course, sections: await findSections(id) } });
}
