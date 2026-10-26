# Progress

Last updated: 2026-10-26

## Current step

**Step 2: project setup, in progress.** Done so far: `git init`,
`.gitignore`, `.gitattributes` (`* text=auto eol=lf`, because the app will
run on Linux), first commit `d930caf` (2026-10-26).

README committed (`cab62d8`) and pushed to the public repo
https://github.com/KomilovIslombek/it-live-lms (2026-10-26). Ask before
every push.

WSL 2 and Docker Desktop installed and working in the user's terminal
(2026-10-26).

Done 2026-10-26: the project database runs in Docker (container
`it-live-lms-db`, host port 5433, user `lms`, database `it_live_lms`,
password only in the gitignored `.env`). 18 tables, 16 triggers,
Asia/Tashkent verified. To query it without reading `.env`:
`docker compose exec -T db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`.

Setup that was done: the user wrote `.env`, `.env.example` and `docker-compose.yml` (one
`db` service: `postgres:18`, host port 5433, named volume at
`/var/lib/postgresql`, `./docs/database` mounted as
`/docker-entrypoint-initdb.d` so the 3 schema files load on first start),
runs `docker compose up -d` and checks `\dt` shows 18 tables. Claude tested
this exact setup in a throwaway compose project first: 18 tables, 16
triggers, Asia/Tashkent, reachable from Windows, data survives
`down`/`up`. To make that work, file 2's reference copies became
`CREATE TABLE IF NOT EXISTS` (2026-10-26; if drawsql rejects that on
import, revisit).

Docker setup committed and pushed (`be117e5`).

Server committed and pushed (`53648ff`). The user then changed
`{ "status": "ok" }` to `{ status: "ok" }` (uncommitted; goes in the next
commit).

Done 2026-10-26: `client/` scaffolded and cleaned by the user: `App.tsx`
shows an `IT Live LMS` heading, demo CSS/assets removed, title set. Build
and lint pass. The user's scaffold came with **ESLint** (`npm run lint`),
not oxlint as in Claude's scratch test. Leftovers: `public/icons.svg`
(unused demo sprite, to delete) and Vite's logo as `favicon.svg` (replace
later). Not committed yet; the user commits themselves.

Client committed and pushed (`8eb03b6`).

Now: Vite proxy `/api` → `http://localhost:4000`, the server route
becomes `/api/health`, and `App.tsx` fetches it and shows the status
(user writes the fetch code). First attempt reviewed 2026-10-26: proxy
and route correct, the happy path works (200 `{"status":"ok"}` through the
proxy). The bug: no error handling. With the server off, the Vite proxy
answers **502 text/plain**, `res.json()` throws, nothing catches it, and
the page stays on "Checking server..." forever. The user fixed it
(2026-10-26): `res.ok` check, error state, `.catch`, `.finally`. The 502
case now shows "Server is not reachable". Remaining issue found in the
second review: `.catch(err => setError(err))` stores an Error _object_ in
a `string | null` state (TypeScript allows it because a catch reason is
`any`), and rendering an object in JSX crashes React. Realistic trigger:
a 200 response that isn't JSON (e.g. a misrouted proxy returning HTML).
Fixed by the user (throws in the `!res.ok` branch, stores
`err.message`), committed and pushed as `30c6b1b`.

Now (2026-10-26): Prettier at the repo root: a root `package.json`
(private, only Prettier, pinned with `--save-exact`), `.prettierrc` = `{}`
(defaults: double quotes, semicolons, 2 spaces), `.prettierignore` =
`package-lock.json` (Prettier 3 also skips everything in `.gitignore`),
scripts `format` / `format:check`, and `.vscode/settings.json` with format
on save. Tested on a clone: `--write` touches 10 files (formatting only,
including the md tables and the server's 4-space indent), and lint and
type-check still pass after it. The formatting goes in its own commit.

Prettier committed and pushed (`5e5fedb`). Claude updated `README.md`
(stack, structure, getting started, status); not committed yet, goes in
with the next commit.

Now (2026-10-26): server ↔ database. Recommended and explained to the
user: plain **`pg`** (node-postgres) with hand-written, parameterized SQL,
no ORM for now, because the SQL files are already the source of truth
(with triggers) and the user wants real SQL skill. Revisit an ORM or
query builder only if it starts to hurt. Migrations get introduced the
first time the schema changes. The step: `npm install pg` +
`-D @types/pg`; `server/.env` with `DATABASE_URL` (port 5433) and
`server/.env.example`; scripts use Node's `--env-file` (`tsx watch
--env-file=.env ...`, `node --env-file=.env dist/index.js`, no dotenv
package); the user writes `src/db.ts` (Pool from `DATABASE_URL`, fail
fast when it's missing, `pool.on("error", ...)`) and makes `/api/health`
run `SELECT 1`: 200 `{ status, database: "ok" }`, or 503 with
`database: "unreachable"`. Tested in scratch: works, and **without
`pool.on("error")` the whole server crashes** when the database goes
away (unhandled 'error' event, code 57P01). With it: 503, then 200 once
the database is back. Relative imports must end in `.js`
(`import { pool } from "./db.js"`) because of ESM + `nodenext`.

Progress 2026-10-26: `pg` and `@types/pg` installed, scripts use
`--env-file`, `server/.env` and `.env.example` exist (port 5433). The user
asked for help with `db.ts`. Their draft was close; Claude explained three
fixes: `new Pool({})` → `new Pool({ connectionString: DATABASE_URL })`
(an empty config silently falls back to localhost:5432, the _local_
Postgres), remove `process.exit(-1)` from `pool.on("error")` (copied from
the pg docs example, but it brings back the crash we want to avoid), and a
clearer error message naming `DATABASE_URL`. Default export kept, so the
import is `import pool from "./db.js"`. The user applied fix 1 and wrote the
`/api/health` check in `index.ts` (works: 200 `database: "ok"` against the
Docker DB). Still open after the 3rd review: `process.exit(-1)` is still
in `pool.on("error")`, the error message says "URL" instead of
`DATABASE_URL`, the 503 body has `status: 503` (should stay `"ok"`, same
shape as the 200 body), and an unused `err` in `catch`. Also decided:
scripts switch from `--env-file` to `--env-file-if-exists` (tested with
tsx watch and node). Reason: with `--env-file` a missing file stops Node
before our code runs ("node: .env: not found", which is what the user hit
when testing by renaming `.env`), and in production Docker passes real
environment variables with no `.env` file, so `npm start` would crash.

Done 2026-10-26: all fixes applied, scripts use `--env-file-if-exists`.
Verified by Claude on a test instance: database up → 200
`database: "ok"`; database stopped → 503 `database: "unreachable"` and
the server stays up (pool error logged); database back → 200; no env
file → "DATABASE_URL is not set" from the user's own check. Not committed
yet; the user commits (server code, `server/.env.example`, README,
PROGRESS, CLAUDE).

Next: the first-deploy decision (needs a VPS), the last part of step 2. Smaller notes: `dataType` →
PascalCase `HealthResponse`, don't put `null` inside the response type
(use `useState<HealthResponse | null>(null)`), the inner `data` shadows
the state name, and "Servers status:" is missing a space. Done = the page shows the server's status
with both dev servers running, and an error message when the server is
stopped.

How the scaffold step was set up: `client/` scaffold. Commands: `npm create vite@latest
client -- --template react-ts --no-interactive`, `npm install`,
`npm run dev`. Tested in scratch: create-vite 9.3, Vite 8.3, React 19.3,
TypeScript 6.0 in the client (the server has 7.0; fine), oxlint as the
linter, its own `client/.gitignore`. The user then strips the demo:
`App.tsx` shows just a heading, deletes `App.css` and the demo assets and
`client/README.md`, and sets the `<title>` in `index.html`. Done =
`npm run dev` shows the heading and `npm run build` passes.

Done 2026-10-26: the user wrote `server/src/index.ts` (Express app,
`/health`, port from env or 4000). Verified: `tsc --noEmit` clean, build
runs, `/health` returns 200 `{"status":"ok"}`. Review notes given: types
on route handlers are inferred (annotate with `Request`/`Response` only
when a handler lives outside `app.get`, e.g. in a controller file); mixed
quotes and semicolons, so add Prettier later. Not committed yet; the user
commits themselves.

How that step was set up: `server/` hello-world. The user runs the setup
commands, creates `tsconfig.json`, and writes `src/index.ts` themselves
(Express app, `GET /health` → `{ "status": "ok" }`, port from
`process.env.PORT` or 4000). Done = `npm run dev` serves
http://localhost:4000/health and `npm run build` makes `dist/` with no
errors. Claude tested this exact setup in a scratch folder first.

Server tooling (tested 2026-10-26): Node 24.18, Express 5.3, TypeScript
7.0 (the new native compiler), tsx 4.23 for dev (`tsx watch`, strips
types, does NOT type-check), `tsc` for build/type-checking, ESM
(`"type": "module"`), `module: nodenext`. tsconfig is hand-written, not
`tsc --init` (its default `"types": []` hides Node's types and it adds
strict extras that would confuse a beginner). npm prints an
"allow-scripts" warning for esbuild (a tsx dependency); tsx works without
approving it.

After that: commit, then `client/` (Vite react-ts).

Then, one at a time: `docker-compose.yml` with a single Postgres service on
host port 5433 → run the 3 schema files into it → `server/` (Express +
TypeScript, hello-world + `/health`) → `client/` (Vite react-ts).

### Step 1 notes (database, done)

The user's v1 (15 tables,
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

1. [done] Database diagram: review the drawsql tables
2. [in progress] Project setup: git + GitHub, folders, Postgres, a first
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
- **TypeScript** on server and client (decided 2026-10-26). The user has
  never used it, so introduce it gradually: only the types each step
  needs, explained when they first appear.
- **Docker for the database only during development** (decided
  2026-10-26): Postgres runs in a container via docker-compose; the Node
  server and Vite client run natively with `npm run dev` (fast reloads,
  no Windows volume problems). Dockerfiles for server/client come at the
  deploy step and reuse the same compose setup.
- Proposed rest of the stack (confirm each part when we reach it): React + Vite, React Router, TanStack Query and Table,
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
  auto-updating updated_at (`setup-timezone-and-triggers.sql`). The user
  re-imported it into drawsql. Step 1 done.
- 2026-10-26: git initialized, first commit `d930caf` (docs + schema).
- 2026-10-26: README added, repo pushed to GitHub (public).
- 2026-10-26: WSL 2 + Docker Desktop installed; Postgres 18 runs in Docker
  with the full schema loaded.
