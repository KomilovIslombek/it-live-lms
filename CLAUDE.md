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
  is on PATH) and runs as the Windows service `postgresql-x64-18`
  (automatic start) on port 5432. So the project's Docker Postgres uses
  host port **5433**; connecting to 5432 hits the wrong database.
- WSL 2 (Ubuntu) and Docker Desktop (per-user install, WSL 2 backend) were
  installed on 2026-10-26: Docker 29.9.2, Compose v5.6.1. `docker.exe` is
  in `C:\Users\i7\AppData\Local\Programs\DockerDesktop\resources\bin`, which
  is on the _user_ PATH. Terminals opened before the install don't see it
  ("docker is not recognized"): restart the app that owns the terminal.
- The user's PowerShell had no execution policy set (Windows default:
  Restricted), so `npm` (npm.ps1) failed with "running scripts is disabled
  on this system". It's not a PATH problem. Fix (2026-10-26): the user runs
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
  themselves; Claude must not change security settings. Workaround if it's
  not set: `npm.cmd`. Claude's own PowerShell runs with Bypass, so it
  doesn't see this error.
- Claude's Bash tool also has the old PATH: prefix commands with
  `export PATH="/c/Users/i7/AppData/Local/Programs/DockerDesktop/resources/bin:$PATH"`.
- `postgres:18` image: mount the data volume at `/var/lib/postgresql`, not
  `/var/lib/postgresql/data` (Postgres 18 moved its data directory).
- Files in `/docker-entrypoint-initdb.d` run only when the data volume is
  empty (first start). After a schema change, `docker compose down -v`
  wipes the volume and the next `up` reloads the schema. That deletes all
  data, so warn the user before suggesting it.
- To test compose without touching the user's containers: copy what's
  needed into the scratchpad and use another project name and port
  (`docker compose -p lmstest`, host port 55433), then `down -v`.
- To test SQL without touching the user's server: `initdb` a throwaway cluster in the scratchpad, start
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
