-- Migration 001 (2026-11-24): link mentors to courses.
--
-- Why a migration: the files in docs/database/ run only when the Docker
-- volume is empty (first start). A database that already has data needs
-- this change on its own. New installs get the same table from
-- drawsql-1-users-courses-payments.sql and its trigger from
-- setup-timezone-and-triggers.sql, so this file is only for existing ones.
--
-- Run it once from the repo root:
--   docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' < docs/database/migrations/001-course-mentors.sql
-- It is safe to run twice (IF NOT EXISTS / OR REPLACE).

BEGIN;

CREATE TABLE IF NOT EXISTS "course_mentors"(
    "id" SERIAL PRIMARY KEY,
    "course_id" INTEGER NOT NULL
        CONSTRAINT "course_mentors_course_id_foreign" REFERENCES "courses"("id") ON DELETE CASCADE,
    "user_id" INTEGER NOT NULL
        CONSTRAINT "course_mentors_user_id_foreign" REFERENCES "users"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_mentors_course_id_user_id_unique" UNIQUE("course_id", "user_id")
);

CREATE OR REPLACE TRIGGER course_mentors_set_updated_at
    BEFORE UPDATE ON "course_mentors"
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
