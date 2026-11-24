import pool from "../db.js";
import { deleteStoredFile } from "../utils/upload.js";

const lessonFiles = (where: string) => `
  SELECT l.video_url AS path FROM lessons l WHERE ${where}
  UNION ALL
  SELECT mf.file_path FROM material_files mf
    JOIN materials m ON m.id = mf.material_id
    JOIN lessons l ON l.id = m.lesson_id WHERE ${where}
  UNION ALL
  SELECT ef.file_path FROM exercise_files ef
    JOIN exercises x ON x.id = ef.exercise_id
    JOIN lessons l ON l.id = x.lesson_id WHERE ${where}`;

const FILES_OF = {
  course: `
    SELECT banner AS path FROM courses WHERE id = $1
    UNION ALL
    SELECT intro_video FROM courses WHERE id = $1
    UNION ALL
    ${lessonFiles("l.section_id IN (SELECT id FROM sections WHERE course_id = $1)")}`,
  section: lessonFiles("l.section_id = $1"),
  lesson: lessonFiles("l.id = $1"),
  material:
    "SELECT file_path AS path FROM material_files WHERE material_id = $1",
  exercise:
    "SELECT file_path AS path FROM exercise_files WHERE exercise_id = $1",
  user: "SELECT profile_img AS path FROM users WHERE id = $1",
} as const;

export async function storedFilesOf(kind: keyof typeof FILES_OF, id: number) {
  const { rows } = await pool.query<{ path: string | null }>(FILES_OF[kind], [
    id,
  ]);
  return rows.map((row) => row.path).filter((path) => path !== null);
}

export async function deleteStoredFiles(paths: (string | null | undefined)[]) {
  await Promise.all(paths.map((path) => deleteStoredFile(path)));
}
