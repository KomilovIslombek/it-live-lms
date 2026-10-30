# Progress

Last updated: 2026-10-29

## Current step

**Step 3: login and roles, starting.** Split into small pieces, one at a
time (the user writes the code, Claude explains, tests the approach in a
scratch folder first, and reviews):

- **3a. Seed script: done 2026-10-30** on the real Docker DB: roles
  admin=1, mentor=2, assistant=3, student=4, and the admin user (id 1,
  role_id 1, bcrypt hash). Second run printed "Admin already exists". Not
  committed yet; the user commits.
- **3b part 1 (now): login without a token yet.** Folder structure:
  `src/app.ts` (the Express app: `express.json()`, health route, mounts
  `/api/auth`), `src/index.ts` (only `app.listen`), `src/routes/auth.routes.ts`
  (Router, `POST /login`), `src/controllers/auth.controller.ts` (zod
  validation, bcrypt compare, responses),
  `src/services/user.service.ts` (`findUserByEmail`: SELECT with JOIN roles,
  `r.title AS role`, returns the row or null). Responses: 200
  `{ user: { id, email, full_name, status, role } }` (never
  `password_hash`), 400 `{ error, details }` from
  `z.flattenError(...).fieldErrors`, 401 "Invalid email or password" for
  both an unknown email and a wrong password, 403 for `status = false`.
  Tested in scratch 2026-10-30 (zod 4.6.7: `z.email()`, `safeParse`,
  `z.flattenError`): all 5 cases behave. Found: malformed JSON gets
  Express's default **HTML** error page with a stack trace, so add a JSON
  error-handling middleware later (3c or before deploy). Testing tool:
  curl in **Git Bash** (in Windows PowerShell 5.1, `curl` is an alias of
  Invoke-WebRequest).
- 3b part 2: sign a JWT and set it in an httpOnly cookie. Recommended:
  `jsonwebtoken`, one token with a 1-day lifetime, no refresh token in v1;
  `httpOnly`, `sameSite: "lax"`, `secure` in production; `JWT_SECRET` in
  `.env`.
- (old 3a notes) **3a. Seed script.** `server/src/scripts/seed.ts`, run with
  `npm run db:seed`. Inserts the 4 roles (admin, mentor, assistant,
  student) and the first admin user, with the admin's email and password
  read from `server/.env` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`),
  never hard-coded. The password is hashed with `bcryptjs` (pure JS, no
  install scripts). Idempotent: `ON CONFLICT ... DO NOTHING`, so running
  it twice changes nothing. Parameterized queries (`$1`) only. The script
  ends with `pool.end()` so the process exits. Tested in scratch
  2026-10-29 against the real schema: bcryptjs 3.0.3 ships its own types
  (no `@types/bcryptjs`), top-level `await` works (ESM), hash starts with
  `$2b$12$`, compare accepts the right password and rejects a wrong one,
  second run prints "already exists". Script:
  `"db:seed": "tsx --env-file-if-exists=.env src/scripts/seed.ts"`; the
  import is `../db.js`; `role_id` via a subquery on `roles.title`.
  2026-10-30: the user's first `seed.ts` reviewed (run unchanged on a
  throwaway DB). Bugs: `for await` with an un-awaited `pool.query` (the 4
  inserts run concurrently: roles got random ids, and the admin SELECT ran
  before the admin row existed, `rowCount: 0`); the whole `QueryResult`
  was passed as `role_id` (Postgres error 22P02); no
  `ON CONFLICT (email) DO NOTHING`, so a 2nd run would fail instead of
  printing "already exists"; `let` → `const`. All four fixed by the user
  (reviewed 2026-10-30, type-check clean). The real Docker DB still had 0
  roles and 0 users before the first real run.
- 3c. `GET /api/auth/me`, auth middleware, `requireRole("admin")`.
- 3d. `POST /api/auth/logout`.
- 3e. Client: React Router, login page, protected admin area.

## Roadmap

Status: done / in progress / next / later

1. [done] Database diagram
2. [done] Project setup: git + GitHub, Docker Postgres, Express +
   TypeScript server connected to the database, React + Vite + TypeScript
   client connected through a proxy, Prettier
3. [in progress] Login and roles (admin, mentor, assistant, student)
4. [next] Admin manages users
5. [next] **First deploy** to a VPS (moved here from step 2, see Decisions)
6. [later] Admin manages courses → sections → lessons → materials
7. [later] Student sees their courses and lessons, with progress
8. [later] Mentor side: assignments, exams, grading, results
9. [later] Extras: dashboard stats, payments, comments, certificates,
   Excel export, landing page
10. [later] Hardening: indexes (with EXPLAIN ANALYZE), tests, i18n, mobile

Steps 1–7 are v1: a deployed project the user can show.

## How the project runs (as of 2026-10-29)

- Database: Docker container `it-live-lms-db` (`docker compose up -d`),
  host port 5433, user `lms`, database `it_live_lms`, password only in the
  gitignored root `.env`. The 3 files in `docs/database/` load on the
  first start with an empty volume. Query it without reading `.env`:
  `docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`.
- Server: `server/`, `npm run dev` (tsx watch, port 4000). `src/db.ts`
  exports a default `pg` Pool from `DATABASE_URL` (fails fast if missing,
  logs idle-client errors). `GET /api/health` → 200
  `{ status: "ok", database: "ok" }` or 503 `database: "unreachable"`.
  Env from `server/.env` via `--env-file-if-exists`.
- Client: `client/`, `npm run dev` (Vite, port 5173). Vite proxies `/api`
  to port 4000. `App.tsx` shows the health status with loading and error
  states. ESLint via `npm run lint`.
- Formatting: Prettier from the repo root (`npm run format`), format on
  save in VS Code.

## Decisions

- Admin side first. Work feature by feature (tables → API → screen).
- **TypeScript** on server and client (2026-10-26). The user had never
  used it: introduce only the types each step needs, explained when they
  first appear.
- **Docker for the database only during development** (2026-10-26). The
  server and client run natively with `npm run dev`. Dockerfiles for them
  come with the first deploy.
- **Plain `pg`, no ORM** (2026-10-26): hand-written, parameterized SQL.
  The SQL files are the schema's source of truth (with triggers), and the
  user wants real SQL skill. Revisit only if it starts to hurt.
  Migrations get introduced the first time the schema changes.
- **First deploy after step 4** (user's choice, 2026-10-29): once login
  and the admin users list exist, so the live link shows something real.
- **Login with email + password for v1** (the user's preference from
  2026-10-24). Phone and OTP later. `users.email` and `users.phone` are
  both still nullable in the schema.
- Online-only school: no cash payments. A student can enroll in a course
  only once.
- The mentor list's show-password "eye" won't be built; it becomes a
  reset-password action when we reach that screen.
- No Notion build journal for this project (user decided 2026-10-24).
  Don't suggest it again unless they bring it up.
- Rest of the proposed stack, to confirm when each part is reached: React
  Router, TanStack Query and Table, react-hook-form + zod, Tailwind +
  shadcn/ui, i18next; S3-compatible file storage; VPS with Nginx and
  HTTPS.

## Open questions (the user will clarify)

1. Mentors per course: one or two? No course ↔ mentor link in the schema
   yet.
2. Do exams belong to a lesson or a section? `exams.lesson_id` for now.

## Database notes

- 18 tables in `docs/database/`: `drawsql-1-users-courses-payments.sql`
  (8 tables), `drawsql-2-course-content.sql` (10 tables, plus
  `CREATE TABLE IF NOT EXISTS` copies of users and courses so drawsql can
  draw its arrows), and `setup-timezone-and-triggers.sql` (Asia/Tashkent
  time zone and 16 `updated_at` triggers; not for drawsql).
- The repo SQL files are the source of truth; drawsql is only for viewing
  (its export drops ON DELETE rules).
- Conventions (the user's choices): `SERIAL PRIMARY KEY`, INTEGER only,
  TIMESTAMPTZ, money as NUMERIC(12,2), `password_hash`, ON DELETE rules on
  every foreign key (CASCADE for the content tree, RESTRICT for payments).
- Not in v1: comments with replies, homework submissions + grading, Q&A,
  ratings, notifications, course assistants.

## Done

- 2026-10-24: Analyzed the Figma design and agreed on the roadmap.
- 2026-10-24: Reviewed the user's first database diagram (15 tables);
  wrote v2, then v3 with the user's conventions. Step 1 done.
- 2026-10-26: git + `.gitattributes` (LF), README, public GitHub repo
  https://github.com/KomilovIslombek/it-live-lms. Ask before every push.
- 2026-10-26: WSL 2 + Docker Desktop installed; Postgres 18 in Docker with
  the schema loaded (`be117e5`).
- 2026-10-26: Express + TypeScript server with `/health` (`53648ff`).
- 2026-10-26: React + Vite + TypeScript client (`8eb03b6`), connected to
  the server through the Vite proxy with loading/error states
  (`30c6b1b`).
- 2026-10-26: Prettier at the repo root, format on save (`5e5fedb`).
- 2026-10-26: Server connected to PostgreSQL with `pg`; `/api/health`
  checks the database (`77cc235`). Step 2 done (deploy moved to step 5).
