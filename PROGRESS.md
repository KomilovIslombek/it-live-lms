# Progress

Last updated: 2026-10-24

## Current step

**Step 1: database diagram, v2 written.** The user's v1 (15 tables,
`C:\Users\i7\Downloads\IT-LIVE-LMS_admin-dashboard_v1.sql`, outside the
repo) was reviewed against the admin screens. At the user's request Claude
wrote the fixed v2 (18 tables) in `docs/database/`, split into two files
for the drawsql free plan (max 15 tables per diagram):
- `drawsql-1-users-courses-payments.sql`: 8 tables
- `drawsql-2-course-content.sql`: 10 tables + short reference copies of
  users and courses so the arrows import

Both files were run in a throwaway Postgres 18: each on its own and both
together (18 tables). Duplicate enrollment and a bad payment status are
rejected, and deleting a course cascades to its sections, lessons and
enrollments.

**The repo SQL files are the source of truth, not drawsql** (user's
decision: drawsql's export drops the ON DELETE rules). Edit the files, then
re-import them into drawsql to see the diagram.

v3 (2026-10-24, user's choices): ids are `SERIAL PRIMARY KEY`, every
integer column is INTEGER (no BIGINT anywhere), plus a third file
`setup-timezone-and-triggers.sql` (not for drawsql): it sets the database
time zone to Asia/Tashkent and adds a trigger on the 16 tables that have
`updated_at` so it changes on every UPDATE. Tested in a throwaway Postgres
18: all three files run, 18 tables, 16 triggers, `now()` shows +05,
updated_at moves on UPDATE.

Next: the user re-imports the two table files into drawsql to check the
diagram, then starts step 2: `git init`, a `.gitignore`, first commit
(local only, no push yet).

Changes in v2 (ids/BIGINT later replaced in v3): identity ids, BIGINT ids, `timestamptz NOT NULL
DEFAULT now()`, typo fixes, money as NUMERIC(12,2) (the problem with
DECIMAL(8,2) was only its size), `password_hash`, UNIQUE on email, phone,
role title, category/level slug, payment method code, transaction_id;
UNIQUE(user_id, course_id) on user_courses, payment status/currency CHECKs,
transaction_id and paid_at nullable (pending payments), ON DELETE rules,
`position` on sections, lessons and exam questions, lessons.name → title,
`video_url`, exams split into exams / exam_questions / exam_attempts, new
`lesson_progress`.

Open questions (the user will clarify; deliberately left out of v2):
1. Mentors per course: one or two? So there is no course ↔ mentor link yet.
2. Do exams belong to a lesson or a section? `exams.lesson_id` for now.
3. Login: email or phone. Both stay nullable for now (user's decision).

Later (not v1): comments with replies, homework submissions + grading,
Q&A, ratings/reviews, notifications, course assistants.

## Roadmap

Status: done / in progress / next / later

1. [in progress] Database diagram: review the drawsql tables
2. [next] Project setup: folders, git, Postgres running in Docker, a first
   deploy of a tiny app
3. [later] Login and roles (admin, mentor, assistant, student)
4. [later] Admin manages users
5. [later] Admin manages courses → sections → lessons → materials
6. [later] Student sees their courses and lessons, with progress
7. [later] Mentor side: assignments, exams, grading, results
8. [later] Extras: dashboard stats, payments, comments, certificates,
   Excel export, landing page
9. [later] Hardening: indexes (with EXPLAIN ANALYZE), tests, i18n, mobile

Steps 1–6 are v1: a deployed project the user can show.

## Decisions

- Admin side first. Work feature by feature.
- Proposed stack (not yet confirmed by the user; confirm at step 2):
  TypeScript; React + Vite, React Router, TanStack Query and Table,
  react-hook-form + zod, Tailwind + shadcn/ui, i18next; Node + Express;
  PostgreSQL + Drizzle ORM; JWT with a refresh token in an httpOnly
  cookie; S3-compatible file storage; Docker Compose; deploy to a VPS
  with Nginx and HTTPS.

- Online-only school: no cash payments. A student can enroll in a course
  only once.
- The mentor list's show-password "eye" will not be built; it gets fixed
  like a real app (reset password action) when we reach the frontend.
- No Notion build journal for this project (user decided 2026-10-24).
  Don't suggest it again unless they bring it up.

## Done

- 2026-10-24: Analyzed the Figma design and agreed on the roadmap above.
- 2026-10-24: Reviewed the first version of the database diagram and wrote
  v2 in `docs/database/` (details under "Current step").
- 2026-10-24: Schema v3: SERIAL/INTEGER ids, Tashkent time zone,
  auto-updating updated_at (`setup-timezone-and-triggers.sql`).
