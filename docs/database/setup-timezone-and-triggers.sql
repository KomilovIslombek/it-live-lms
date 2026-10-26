-- IT Live LMS: database settings and triggers.
-- NOT for drawsql (a diagram has no settings or triggers).
-- Run this AFTER both table files:
--   1. drawsql-1-users-courses-payments.sql
--   2. drawsql-2-course-content.sql (without its two reference copies, since
--      part 1 already creates users and courses)
--   3. this file

-- 1. Uzbekistan time (UTC+5, no daylight saving).
-- TIMESTAMPTZ stores the exact moment; this setting decides which time zone
-- the database shows it in. It applies to new connections to this database.
DO $$
BEGIN
    EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'Asia/Tashkent');
END
$$;

-- 2. updated_at changes by itself on every UPDATE.
-- One function, then one trigger per table that has an updated_at column.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Part 1 tables
CREATE TRIGGER roles_set_updated_at BEFORE UPDATE ON "roles" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON "users" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER categories_set_updated_at BEFORE UPDATE ON "categories" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER levels_set_updated_at BEFORE UPDATE ON "levels" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER courses_set_updated_at BEFORE UPDATE ON "courses" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER user_courses_set_updated_at BEFORE UPDATE ON "user_courses" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payment_methods_set_updated_at BEFORE UPDATE ON "payment_methods" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON "payments" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Part 2 tables (exam_attempts and lesson_progress have no updated_at)
CREATE TRIGGER sections_set_updated_at BEFORE UPDATE ON "sections" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER lessons_set_updated_at BEFORE UPDATE ON "lessons" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER materials_set_updated_at BEFORE UPDATE ON "materials" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER material_files_set_updated_at BEFORE UPDATE ON "material_files" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER exercises_set_updated_at BEFORE UPDATE ON "exercises" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER exercise_files_set_updated_at BEFORE UPDATE ON "exercise_files" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER exams_set_updated_at BEFORE UPDATE ON "exams" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER exam_questions_set_updated_at BEFORE UPDATE ON "exam_questions" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
