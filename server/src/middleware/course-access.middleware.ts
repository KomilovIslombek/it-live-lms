import type { NextFunction, Request, RequestHandler, Response } from "express";
import {
  courseIdOf,
  isCourseMentor,
  isEnrolled,
  type ContentKind,
} from "../services/access.service.js";
import { parseId } from "../utils/http.js";

// A guard answers: may this user touch this piece of content?
// Use: guard("lesson", "id") → reads req.params.id as a lesson id.
export type CourseGuard = (kind: ContentKind, param: string) => RequestHandler;

// Admin: may touch everything.
export const allowAll: CourseGuard = () => (_req, _res, next) => next();

// Builds a guard from one question: "may user X work with course Y?"
function guardWith(
  check: (userId: number, courseId: number) => Promise<boolean>,
  message: string,
): CourseGuard {
  return (kind, param) =>
    async (req: Request, res: Response, next: NextFunction) => {
      const id = parseId(req.params[param]);
      // A bad id or a missing item: let the controller answer 400 / 404
      // exactly as it does for the admin.
      if (id === null) return next();
      const courseId = await courseIdOf(kind, id);
      if (courseId === null) return next();

      // requireAuth ran before, so req.user is there.
      if (!(await check(Number(req.user?.sub), courseId))) {
        return res.status(403).json({ error: message });
      }
      return next();
    };
}

// Mentor: only the courses they are linked to (course_mentors).
export const mentorOwnsCourse = guardWith(
  isCourseMentor,
  "This course is not yours",
);

// Student: only the courses they are enrolled in (user_courses).
export const studentEnrolled = guardWith(
  isEnrolled,
  "You are not enrolled in this course",
);
