import pool from "../db.js";

// Who is in a course: mentors (course_mentors) and students
// (user_courses, "enrollment"). Payments are not used yet, so the admin
// enrolls students by hand.

export interface CourseMentor {
  user_id: number;
  full_name: string;
  phone: string | null;
  status: boolean;
  added_at: Date;
}

export interface CourseStudent {
  user_id: number;
  full_name: string;
  phone: string | null;
  status: boolean;
  enrolled_at: Date;
  lessons_done: number;
  lessons_total: number;
  progress_percent: number;
}

export async function findMentors(courseId: number) {
  const { rows } = await pool.query<CourseMentor>(
    `SELECT u.id AS user_id, u.full_name, u.phone, u.status, cm.created_at AS added_at
      FROM course_mentors cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.course_id = $1
      ORDER BY cm.id`,
    [courseId],
  );
  return rows;
}

// Each student with their progress in this course: lessons they marked as
// done out of all lessons of the course.
export async function findStudents(courseId: number) {
  const { rows } = await pool.query<Omit<CourseStudent, "progress_percent">>(
    `SELECT u.id AS user_id, u.full_name, u.phone, u.status,
        uc.created_at AS enrolled_at,
        (SELECT COUNT(*)::int FROM lesson_progress lp
          JOIN lessons l ON l.id = lp.lesson_id
          JOIN sections s ON s.id = l.section_id
          WHERE s.course_id = uc.course_id AND lp.user_id = u.id) AS lessons_done,
        (SELECT COUNT(*)::int FROM lessons l
          JOIN sections s ON s.id = l.section_id
          WHERE s.course_id = uc.course_id) AS lessons_total
      FROM user_courses uc
      JOIN users u ON u.id = uc.user_id
      WHERE uc.course_id = $1
      ORDER BY uc.id`,
    [courseId],
  );
  return rows.map((row) => ({
    ...row,
    progress_percent: percent(row.lessons_done, row.lessons_total),
  }));
}

// 3 of 8 → 38. No lessons yet → 0 (not a division by zero).
export function percent(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part * 100) / whole);
}

// INSERT ... SELECT with a role check: the row is added only when the user
// exists AND has the right role. No row back = not a mentor / student.
// Throws UNIQUE_VIOLATION when the user is already in the course.
async function addMember(
  table: "course_mentors" | "user_courses",
  role: "mentor" | "student",
  courseId: number,
  userId: number,
) {
  const { rowCount } = await pool.query(
    `INSERT INTO ${table} (course_id, user_id)
      SELECT $1, u.id FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = $2 AND r.title = $3`,
    [courseId, userId, role],
  );
  return rowCount === 1;
}

export const addMentor = (courseId: number, userId: number) =>
  addMember("course_mentors", "mentor", courseId, userId);

export const enrollStudent = (courseId: number, userId: number) =>
  addMember("user_courses", "student", courseId, userId);

export async function removeMentor(courseId: number, userId: number) {
  const { rowCount } = await pool.query(
    "DELETE FROM course_mentors WHERE course_id = $1 AND user_id = $2",
    [courseId, userId],
  );
  return rowCount === 1;
}

// The student's progress and exam attempts stay in the database: if they
// are enrolled again later, nothing is lost.
export async function unenrollStudent(courseId: number, userId: number) {
  const { rowCount } = await pool.query(
    "DELETE FROM user_courses WHERE course_id = $1 AND user_id = $2",
    [courseId, userId],
  );
  return rowCount === 1;
}
