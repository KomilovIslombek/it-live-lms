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
- **3b part 1. Login without a token: done** (2026-10-30, `b7f6eae`). `POST /api/v1/auth/login`. Structure:
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
- **3b part 2. JWT in an httpOnly cookie: done** (2026-10-30, `d199b7f`).
  `src/utils/jwt.ts`: `JWT_SECRET` from `server/.env` (fail fast),
  `TokenPayload = { sub: string; role: string }`, `signToken` (1 day),
  `verifyToken` (`as TokenPayload`). Login sets cookie `token` with
  `httpOnly`, `sameSite: "lax"`, `secure` in production, `maxAge` 1 day;
  no cookie on failure. TypeScript lesson: an `if (!x) throw` check at
  module level doesn't carry into a function declaration, so copy it into
  `const JWT_SECRET: string = secret` after the check.
- **3c part 1. Who am I: done** (2026-10-30, `9f01a38`). `cookieParser()`
  after `express.json()`; `src/types/express.d.ts` adds
  `user?: TokenPayload` to Express's `Request` (declaration merging);
  `src/middleware/auth.middleware.ts` → `requireAuth` (401 "Not logged
  in!" without a cookie, 401 "Session expired or invalid" when
  `verifyToken` throws, else `req.user` + `next()`); `findUserById`
  (no `password_hash`); `GET /api/v1/auth/me` loads the user fresh from
  the DB and returns 401 if the user is gone or deactivated.
  `cookies.txt` (curl's cookie jar) is in the root `.gitignore`. Lesson
  from the review: `pool.query<T>` and `as` are promises to TypeScript,
  not checks; a SELECT typo (`u.id, u.id`) passed the type-check.
- **3c part 2 (now): JSON errors.** Tested in scratch 2026-10-30. The user
  writes `src/middleware/error.middleware.ts`: `notFound(_req, res)` →
  404 `{ error: "Not found" }`, mounted as `app.use("/api", notFound)`
  after all routes; `errorHandler: ErrorRequestHandler`
  (`(err: unknown, _req, res, _next)`, all 4 parameters required, mounted
  last): narrow `unknown` with `typeof err === "object" && err !== null &&
"type" in err && err.type === "entity.parse.failed"` → 400
  `{ error: "Invalid JSON" }`; anything else → `console.error(err)` and
  500 `{ error: "Internal server error" }` (never send `err.message` or
  the stack to the client). Verified: broken JSON 400 JSON, unknown route
  and wrong method 404, login and health unaffected, and a database
  failure during login → 500 JSON instead of an HTML page. Express 5
  passes errors from `async` handlers to the error handler by itself, so
  controllers need no try/catch for unexpected errors.
  User's version reviewed 2026-10-30: correct (narrowing, order in
  `app.ts`, typecheck clean), but **`console.error(err)` is missing**
  before the 500, so real errors would vanish silently. Not committed
  yet.
- **Postman (added 2026-10-30, at the user's request).** Claude wrote
  `postman/it-live-lms.postman_collection.json` (Health; Auth: Login, Me,
  Me without a cookie, Me with an invalid token; Errors: wrong password,
  unknown email, invalid body, broken JSON, unknown route; 21 tests) and
  `postman/local.postman_environment.json` (secrets left empty). Run with
  the Postman CLI against the user's current code on a throwaway DB: 10
  requests, 21 assertions, 0 failed. README has an API table and import
  steps. Not committed yet; goes in with 3c part 2. From now on, every
  new endpoint gets a request with tests in this collection. The user's
  own import attempt went wrong, so at their request (2026-10-30) Claude
  connected via the Postman MCP connector and created the same collection
  and environment in their **menTalabaman** workspace (ids in
  CLAUDE.md). Verified all 10 requests, tests and `disableCookies` came
  through. The user still fills in `adminEmail` / `adminPassword` in the
  environment. Found afterwards: the user's Postman app had linked the
  repo's `postman/` folder to "My Workspace" as a local workspace and
  wrote `postman/.postman/resources.yaml` plus a converted YAML copy under
  `postman/postman/` (collections, environment with empty email/password,
  globals). Untracked, no secrets, duplicates of the two JSON files, and
  Prettier flags one of them. Deleted with the user's OK (2026-10-30), and
  both folders are now in `.gitignore` in case the app writes them again.
  The user also added the missing `console.error(err)`; typecheck clean.
  Ready to commit (3c part 2 + Postman), the user commits.
- `requireRole("admin")` moves to step 4, where the first admin-only route
  (the users list) needs it.
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
