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
- **3c part 2. JSON errors: done** (2026-10-30, `4a1e6d6`).
  `src/middleware/error.middleware.ts`: `notFound` (404 JSON for unknown
  `/api` routes) and `errorHandler: ErrorRequestHandler` (broken JSON →
  400 "Invalid JSON", else `console.error(err)` + 500 "Internal server
  error"), mounted last in `app.ts`. Lesson: narrowing `unknown` step by
  step. Claude checked the 500 path on a copy of the committed code
  (2026-10-30): with the database stopped, login and `/me` answer 500
  JSON, `/api/health` 503, the server stays up and logs ECONNREFUSED, and
  everything works again once the database is back.
- **Postman** (2026-10-30, `4a1e6d6`): `postman/it-live-lms.postman_collection.json`
  and `postman/local.postman_environment.json` in the repo; the same
  collection and environment in the user's Postman cloud (menTalabaman
  workspace, ids in CLAUDE.md). Folders the Postman app writes when it
  links this folder (`postman/postman/`, `postman/.postman/`) are
  gitignored. Every new endpoint gets a request with tests, and the cloud
  copy is updated after the repo file.
- **3d. Logout: done** (2026-10-30, not committed yet; the user commits).
  The user's code matches the plan below, typecheck clean. Claude added
  "Logout" and "Me after logout → 401" at the **end** of the Auth folder
  (cookie-less requests before them don't care about order) in the repo
  file and in the cloud copy (`createCollectionRequest` into folder
  `75b80d4d-303c-42ad-99b0-05967bbf9661`). Full run on a copy of the
  user's code: 12 requests, 24 assertions, 0 failed. The cloud Auth folder
  also has the user's own test-less "Logout" (id
  `97473ca5-a5d5-4a28-b3be-24dd18b14499`), a duplicate; asked before
  deleting it. README API table has the logout row.
- (3d plan, as given) Tested on a copy 2026-10-30: controller
  `logout(_req, res)` calls `res.clearCookie("token", { httpOnly: true,
sameSite: "lax", secure: NODE_ENV === "production" })` (same options as
  when it was set; no `maxAge`, Express 5 ignores it there) and answers
  `res.status(204).end()`; route `router.post("/logout", logout)` with
  **no** `requireAuth` (logging out twice or while logged out is
  harmless, still 204). Verified: `Set-Cookie: token=; Expires=Thu, 01 Jan
1970 ...; HttpOnly; SameSite=Lax`, then `/me` 401. Postman additions
  tested with the CLI (12 requests, 24 assertions, 0 failed): in Auth,
  after "Me (logged in)", add "Logout" (204, `pm.cookies.has("token")`
  false) and "Me after logout → 401". Claude adds them to the repo file
  and the cloud copy once the user's logout is in. Teach the limit of
  stateless JWTs: a copied token stays valid until it expires; real
  revocation needs a server-side list (later, if ever).
- `requireRole("admin")` moves to step 4, where the first admin-only route
  (the users list) needs it.
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
