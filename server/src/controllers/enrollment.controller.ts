import type { Request, Response } from "express";
import * as members from "../services/enrollment.service.js";
import * as results from "../services/result.service.js";
import { courseMemberSchema } from "../schemas/content.schema.js";
import { parseId, sendFieldError, sendValidationError } from "../utils/http.js";
import { UNIQUE_VIOLATION, pgError } from "../utils/pg-errors.js";
import { rowExists } from "../utils/sql.js";

async function courseFromUrl(req: Request, res: Response) {
  const courseId = parseId(req.params.courseId);
  if (courseId === null) {
    res.status(400).json({ error: "Invalid id" });
    return null;
  }
  if (!(await rowExists("courses", courseId))) {
    res.status(404).json({ error: "Course not found" });
    return null;
  }
  return courseId;
}

export async function listCourseMentors(req: Request, res: Response) {
  const courseId = await courseFromUrl(req, res);
  if (courseId === null) return;
  return res.status(200).json({ mentors: await members.findMentors(courseId) });
}

export async function listCourseStudents(req: Request, res: Response) {
  const courseId = await courseFromUrl(req, res);
  if (courseId === null) return;
  return res
    .status(200)
    .json({ students: await members.findStudents(courseId) });
}

export async function listCourseResults(req: Request, res: Response) {
  const courseId = await courseFromUrl(req, res);
  if (courseId === null) return;
  return res
    .status(200)
    .json({ results: await results.findByCourse(courseId) });
}

function addMemberHandler(role: "mentor" | "student") {
  const add = role === "mentor" ? members.addMentor : members.enrollStudent;
  const list = role === "mentor" ? members.findMentors : members.findStudents;

  return async (req: Request, res: Response) => {
    const courseId = await courseFromUrl(req, res);
    if (courseId === null) return;

    const parsed = courseMemberSchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(res, parsed.error);

    try {
      const added = await add(courseId, parsed.data.user_id);
      if (!added) {
        return sendFieldError(res, "user_id", `No ${role} with this id`);
      }
    } catch (err) {
      if (pgError(err).code === UNIQUE_VIOLATION) {
        return res
          .status(409)
          .json({ error: `This ${role} is already in the course` });
      }
      throw err;
    }

    const all = await list(courseId);
    const member = all.find((m) => m.user_id === parsed.data.user_id);
    return res.status(201).json({ [role]: member });
  };
}

export const addCourseMentor = addMemberHandler("mentor");
export const enrollCourseStudent = addMemberHandler("student");

function removeMemberHandler(role: "mentor" | "student") {
  const remove =
    role === "mentor" ? members.removeMentor : members.unenrollStudent;

  return async (req: Request, res: Response) => {
    const courseId = parseId(req.params.courseId);
    const userId = parseId(req.params.userId);
    if (courseId === null || userId === null) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const removed = await remove(courseId, userId);
    if (!removed) {
      return res
        .status(404)
        .json({ error: `This ${role} is not in the course` });
    }
    return res.status(204).end();
  };
}

export const removeCourseMentor = removeMemberHandler("mentor");
export const unenrollCourseStudent = removeMemberHandler("student");
