import pool from "../db.js";

// The mentor's panel: a smaller admin, limited to their own courses.

export interface MentorCourse {
  id: number;
  title: string;
  banner: string;
  status: boolean;
  category: string;
  level: string;
  sections_count: number;
  lessons_count: number;
  students_count: number;
}

// The courses this mentor is linked to (course_mentors).
export async function findMyCourses(mentorId: number) {
  const { rows } = await pool.query<MentorCourse>(
    `SELECT c.id, c.title, c.banner, c.status,
        cat.title AS category, l.title AS level,
        (SELECT COUNT(*)::int FROM sections s WHERE s.course_id = c.id) AS sections_count,
        (SELECT COUNT(*)::int FROM lessons ls
          JOIN sections s ON s.id = ls.section_id
          WHERE s.course_id = c.id) AS lessons_count,
        (SELECT COUNT(*)::int FROM user_courses uc WHERE uc.course_id = c.id) AS students_count
      FROM course_mentors cm
      JOIN courses c ON c.id = cm.course_id
      JOIN categories cat ON cat.id = c.category_id
      JOIN levels l ON l.id = c.level_id
      WHERE cm.user_id = $1
      ORDER BY c.id DESC`,
    [mentorId],
  );
  return rows;
}
