-- IT Live LMS: database diagram, part 2 of 2 (course content and learning)
-- 10 tables + 2 reference copies (users, courses) = 12. Import into drawsql.app as PostgreSQL.
-- "users" and "courses" here are short copies so the arrows have something
-- to point to. Their full definitions live in drawsql-1-users-courses-payments.sql:
-- edit them there, not here.
--
-- Not decided yet (waiting on the user):
-- - how mentors link to courses (one or two mentors per course), so no link yet
-- - whether exams belong to a lesson or a section; exams.lesson_id for now

CREATE TABLE "users"(
    "id" SERIAL PRIMARY KEY,
    "full_name" VARCHAR(255) NOT NULL
);
COMMENT
ON COLUMN
    "users"."id" IS 'Reference copy. Full table is in part 1';

CREATE TABLE "courses"(
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL
);
COMMENT
ON COLUMN
    "courses"."id" IS 'Reference copy. Full table is in part 1';

CREATE TABLE "sections"(
    "id" SERIAL PRIMARY KEY,
    "course_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT
ON COLUMN
    "sections"."position" IS 'Order inside the course: 1, 2, 3...';

CREATE TABLE "lessons"(
    "id" SERIAL PRIMARY KEY,
    "section_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "video_url" VARCHAR(255) NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT
ON COLUMN
    "lessons"."video_url" IS 'YouTube (unlisted) or Vimeo link';
COMMENT
ON COLUMN
    "lessons"."position" IS 'Order inside the section: 1, 2, 3...';

CREATE TABLE "materials"(
    "id" SERIAL PRIMARY KEY,
    "lesson_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "material_files"(
    "id" SERIAL PRIMARY KEY,
    "material_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(255) NULL,
    "file_size" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT
ON COLUMN
    "material_files"."file_size" IS 'In bytes';

CREATE TABLE "exercises"(
    "id" SERIAL PRIMARY KEY,
    "lesson_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "exercise_files"(
    "id" SERIAL PRIMARY KEY,
    "exercise_id" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" VARCHAR(255) NULL,
    "file_size" INTEGER NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT
ON COLUMN
    "exercise_files"."file_size" IS 'In bytes';

CREATE TABLE "exams"(
    "id" SERIAL PRIMARY KEY,
    "lesson_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "pass_percent" INTEGER NOT NULL DEFAULT 60,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "exams" ADD CONSTRAINT "exams_pass_percent_check" CHECK("pass_percent" BETWEEN 0 AND 100);
COMMENT
ON COLUMN
    "exams"."lesson_id" IS 'Not final: may move to section_id';
COMMENT
ON COLUMN
    "exams"."pass_percent" IS 'Share of correct answers needed to pass';

CREATE TABLE "exam_questions"(
    "id" SERIAL PRIMARY KEY,
    "exam_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer_a" VARCHAR(255) NOT NULL,
    "answer_b" VARCHAR(255) NOT NULL,
    "answer_c" VARCHAR(255) NOT NULL,
    "answer_d" VARCHAR(255) NOT NULL,
    "correct_answer" CHAR(1) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "exam_questions" ADD CONSTRAINT "exam_questions_correct_answer_check" CHECK("correct_answer" IN ('a', 'b', 'c', 'd'));

CREATE TABLE "exam_attempts"(
    "id" SERIAL PRIMARY KEY,
    "exam_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT FALSE,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMPTZ NULL
);
COMMENT
ON COLUMN
    "exam_attempts"."passed" IS 'Results page: O''tgan / O''tmagan';
COMMENT
ON COLUMN
    "exam_attempts"."finished_at" IS 'Empty while the student is still taking the exam';

CREATE TABLE "lesson_progress"(
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "completed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_lesson_id_unique" UNIQUE("user_id", "lesson_id");
COMMENT
ON COLUMN
    "lesson_progress"."completed_at" IS 'A row means the student finished the lesson. Progress % = finished lessons / all lessons';

-- Content belongs to its parent: deleting a course deletes its sections,
-- their lessons, and everything inside them (CASCADE).
ALTER TABLE
    "sections" ADD CONSTRAINT "sections_course_id_foreign" FOREIGN KEY("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE
    "lessons" ADD CONSTRAINT "lessons_section_id_foreign" FOREIGN KEY("section_id") REFERENCES "sections"("id") ON DELETE CASCADE;
ALTER TABLE
    "materials" ADD CONSTRAINT "materials_lesson_id_foreign" FOREIGN KEY("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE;
ALTER TABLE
    "material_files" ADD CONSTRAINT "material_files_material_id_foreign" FOREIGN KEY("material_id") REFERENCES "materials"("id") ON DELETE CASCADE;
ALTER TABLE
    "exercises" ADD CONSTRAINT "exercises_lesson_id_foreign" FOREIGN KEY("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE;
ALTER TABLE
    "exercise_files" ADD CONSTRAINT "exercise_files_exercise_id_foreign" FOREIGN KEY("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE;
ALTER TABLE
    "exams" ADD CONSTRAINT "exams_lesson_id_foreign" FOREIGN KEY("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE;
ALTER TABLE
    "exam_questions" ADD CONSTRAINT "exam_questions_exam_id_foreign" FOREIGN KEY("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE;
ALTER TABLE
    "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_foreign" FOREIGN KEY("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE;
ALTER TABLE
    "exam_attempts" ADD CONSTRAINT "exam_attempts_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE
    "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE
    "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_foreign" FOREIGN KEY("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE;
