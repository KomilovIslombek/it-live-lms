# IT Live LMS

A learning management system for an online IT school. Admins build
courses (sections → lessons → materials, assignments and exams), mentors
teach and grade, and students learn and track their progress.

> **Status: early development.** The database, an Express API and a React
> client are set up and talk to each other. Features come next. See
> [What's built](#whats-built) below.

## Roles

| Role      | What they do                                                        |
| --------- | ------------------------------------------------------------------- |
| Admin     | Manages users, courses and their content, payments and comments     |
| Mentor    | Manages their own courses, grades assignments and exams             |
| Assistant | Helps mentors with their courses                                    |
| Student   | Takes enrolled courses, watches lessons, does assignments and exams |

## Tech stack

- **Language:** TypeScript (server and client)
- **Database:** PostgreSQL 18, run with Docker Compose
- **Backend:** Node.js 24, Express 5
- **Frontend:** React 19, Vite 8
- **Tooling:** ESLint, Prettier
- **Planned:** Tailwind CSS and shadcn/ui, deployment to a Linux server

## Project structure

```
client/                  React app (Vite). Calls the API through /api
server/                  Express API
  src/index.ts           app entry point
docs/database/           database schema (source of truth)
docker-compose.yml       PostgreSQL for local development
```

## Getting started

Requirements: Node.js 24+, Docker Desktop.

```bash
# 1. Database: copy .env.example to .env, fill in the values, then
docker compose up -d

# 2. API (http://localhost:4000)
cd server
npm install
npm run dev

# 3. Client (http://localhost:5173), in a second terminal
cd client
npm install
npm run dev
```

In development, Vite forwards every request starting with `/api` to the
Express server, so the browser only talks to one address.

## Database

18 tables in two files, split so each one can be imported into
[drawSQL](https://drawsql.app) as a diagram (the free plan allows 15
tables per diagram), plus one setup file:

| File                                   | Contents                                       |
| -------------------------------------- | ---------------------------------------------- |
| `drawsql-1-users-courses-payments.sql` | users, roles, courses, enrollments, payments   |
| `drawsql-2-course-content.sql`         | sections, lessons, materials, exams, progress  |
| `setup-timezone-and-triggers.sql`      | Tashkent time zone, auto-updating `updated_at` |

Docker Compose loads all three automatically the first time the database
starts with an empty volume.

## What's built

- [x] Database schema
- [x] Project setup: Docker database, Express + TypeScript API, React +
      TypeScript client, connected through a proxy
- [x] API connected to the database (`GET /api/health` reports server and
      database status)
- [ ] Login and roles
- [ ] Admin: users
- [ ] Admin: courses, sections, lessons, materials
- [ ] Student: my courses, lessons, progress
- [ ] Mentor: assignments, exams, grading, results
- [ ] Payments, comments, dashboard stats, certificates, landing page

## Credits

UI design: IT Live Academy (Figma).
