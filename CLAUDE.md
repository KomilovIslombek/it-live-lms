# IT Live LMS — notes for Claude

Read this first in every session. The current status (what's done, what's
in progress, what's next) lives in PROGRESS.md, imported below. **Keep
PROGRESS.md current**: update it whenever a step starts or finishes or a
decision is made, not only at the end of a session. A fresh session must
be able to continue from these two files alone.

@PROGRESS.md

## What this project is

A full-stack learning management system (LMS), built by the user as a
portfolio project to get a job. The user is learning while building, so
**teaching mode applies** (see global CLAUDE.md): one step at a time, the
user writes the application code, and Claude explains, reviews and hands
over shell commands. The user asked to keep explanations short and avoid
overwhelming them with information.

It is planned to be deployed to a real server.

## The design (Figma)

- File: https://www.figma.com/design/F8MPgJDOxGP5LCN6KI9Kw7/IT-Live-Academy--Copy---Copy-
- File key `F8MPgJDOxGP5LCN6KI9Kw7`. Page node ids: Landing page `10:1241`,
  Admin dashboard `0:1`, Mentor dashboard `10:169`, Student dashboard
  `10:705`, Certificate `1490:21966`, Components `3:540`.
- Page metadata is huge (the admin page is ~1.3M chars). Don't read it raw:
  save it, then list only the top-level frame names with a small node script.
- The design and brand belong to IT Live Academy. Credit it in the README
  and consider renaming or using a different logo for a public deploy.
- UI text is in Uzbek. Glossary: Foydalanuvchilar = users, Mentorlar =
  mentors, Assistent = assistant, O'quvchilar = students, Kurslar =
  courses, Kurs kategoriyalari = course categories, Bo'limlar = sections,
  Darslar = lessons, Materiallar = materials, Vazifalar = assignments,
  Imtihonlar / Testlar = exams / tests, Savol-javoblar = Q&A, Uyga
  vazifalar = homework, To'lovlar = payments, Izohlar = comments,
  Natijalar = results, Sertifikat = certificate, Qo'shish = add.

## The big picture

Four apps on one backend and one database:
- **Admin** creates everything: users by role, courses → sections →
  lessons → materials/assignments/exams, payments, comments.
- **Mentor**: a smaller admin panel limited to their own courses, plus
  grading, results and questions.
- **Student**: my courses with progress, the video lesson view, materials,
  tasks, quizzes, results, Q&A.
- **Public site**: landing page, course catalog, course page, auth
  (login, registration, OTP, reset password).

Order of work: admin first, because it creates the data everyone else
needs. Work feature by feature (tables → API → screen), not the whole
backend and then the whole frontend.

## What the user already knows (as of 2026-10-24)

Node, Express, PostgreSQL basics (CRUD, JOINs, aggregate functions, sort,
GROUP BY; no indexes yet), MongoDB Atlas (reviewed), vanilla JS, React,
Vite, some Tailwind and shadcn. Docker: theory from videos only.

## Dev workflow and gotchas

- drawsql.app free plan: max 15 tables per diagram. The schema is split
  into two files in `docs/database/`; the second one carries short
  reference copies of `users` and `courses` so its foreign keys import.
  Edit those two tables only in file 1.
- PostgreSQL 18 is installed locally (`C:\Program Files\PostgreSQL\18\bin`
  is on PATH). Docker is not installed yet. To test SQL without touching
  the user's server: `initdb` a throwaway cluster in the scratchpad, start
  it on another port, run the files, stop it and delete it.
- Postgres messages on this machine are in Russian.
- Don't name a database `full`: it's a reserved word.
- The SQL files in `docs/database/` are the source of truth; drawsql is
  only for viewing (its export drops ON DELETE rules). Keep the two table
  files parseable by drawsql: no functions, triggers or settings in them.
  Those go in `setup-timezone-and-triggers.sql`, run after the tables.
- User's schema conventions: `SERIAL PRIMARY KEY` ids, INTEGER for all
  integer columns (no BIGINT), TIMESTAMPTZ with the database time zone set
  to Asia/Tashkent, and `updated_at` maintained by the `set_updated_at()`
  trigger. Any new table with `updated_at` needs its own trigger line.
- For later: node-postgres returns NUMERIC (prices, amounts) as strings.
