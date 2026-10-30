# Progress

Last updated: 2026-10-30

## Current step

**Step 3: login and roles, in progress.** Small pieces, one at a time:
the user writes the code; Claude explains, tests the approach in a
scratch folder first, and reviews.

- **3a. Seed script: done** (2026-10-30, `8c9e686`). `npm run db:seed`
  (`server/src/scripts/seed.ts`) inserts roles admin=1, mentor=2,
  assistant=3, student=4 and the first admin from `SEED_ADMIN_EMAIL` /
  `SEED_ADMIN_PASSWORD` in `server/.env`, hashed with bcryptjs (cost 12).
  `ON CONFLICT DO NOTHING` makes it re-runnable. Lessons from the review:
  `await` inside a plain `for` (not `for await`), the id is in
  `result.rows[0]`, not the result object.
- **3b part 1. Login without a token: done** (2026-10-30, not committed
  yet; the user commits). `POST /api/v1/auth/login`. Structure:
  `src/app.ts` (app, `express.json()`, `/api/health`, mounts
  `/api/v1/auth`), `src/index.ts` (only `listen`), `routes/auth.routes.ts`,
  `controllers/auth.controller.ts`, `schemas/auth.schema.ts`
  (`loginSchema`, `LoginInput`), `services/user.service.ts`
  (`findUserByEmail`, JOIN roles, `r.title AS role`). Responses: 200
  `{ user }` without `password_hash`; 400 `{ error, details }`; 401
  "Invalid email or password" for unknown email and wrong password alike;
  403 when `status = false`. The user ran all 4 curl cases in Git Bash
  with the expected results. `server/tsconfig.json` now has
  `noUncheckedIndexedAccess`, and `npm run typecheck` (`tsc --noEmit`) is
  clean. Lessons from the review: `import type` for types, check `null`
  before using a value, `return` on every early response, one response
  shape.
- **3b part 2 (next): JWT in an httpOnly cookie.** Recommended:
  `jsonwebtoken`, one token with a 1-day lifetime, no refresh token in
  v1; cookie `httpOnly`, `sameSite: "lax"`, `secure` in production;
  `JWT_SECRET` in `server/.env`. Test it in scratch before giving the
  step.
- 3c. `GET /api/v1/auth/me`, auth middleware, `requireRole("admin")`. Add
  a JSON error-handling middleware around here: malformed JSON currently
  gets Express's default HTML error page with a stack trace.
- 3d. `POST /api/v1/auth/logout`.
- 3e. Client: React Router, login page, protected admin area.

Small things for later: lowercase emails before saving and looking them
up (`Admin@x.com` vs `admin@x.com`); the controller and schema still use
`import z from "zod"` (works; zod's docs use `import { z } from "zod"`).
Testing tool: curl in Git Bash (in Windows PowerShell 5.1, `curl` is an
alias of Invoke-WebRequest).

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
