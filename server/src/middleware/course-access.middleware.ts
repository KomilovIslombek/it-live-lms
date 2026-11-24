import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  courseIdOf,
  isCourseMentor,
  isEnrolled,
  type ContentKind,
} from "../services/access.service.js";
import { parseId } from "../utils/http.js";

export type CourseGuard = (kind: ContentKind, param: string) => RequestHandler;

export const allowAll: CourseGuard = () => (_req, _res, next) => next();

function guardWith(
  check: (userId: number, courseId: number) => Promise<boolean>,
  message: string,
): CourseGuard {
  return (kind, param) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const id = parseId(req.params[param]);
      if (id === null) return next();
      const courseId = await courseIdOf(kind, id);
      if (courseId === null) return next();

      if (!(await check(Number(req.user?.sub), courseId))) {
        return res.status(403).json({ error: message });
      }
      return next();
    };
}

export const mentorOwnsCourse = guardWith(
  isCourseMentor,
  "This course is not yours",
);

export const studentEnrolled = guardWith(
  isEnrolled,
  "You are not enrolled in this course",
);
