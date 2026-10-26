# IT Live LMS

A learning management system for an online IT school. Admins build
courses (sections → lessons → materials, assignments and exams), mentors
teach and grade, and students learn and track their progress.

> **Status: early development.** The database schema is designed; the
> backend and frontend come next. See [What's built](#whats-built) below.

## Roles

| Role | What they do |
|---|---|
| Admin | Manages users, courses and their content, payments and comments |
| Mentor | Manages their own courses, grades assignments and exams |
| Assistant | Helps mentors with their courses |
| Student | Takes enrolled courses, watches lessons, does assignments and exams |

## Tech stack (planned)

- **Database:** PostgreSQL
- **Backend:** Node.js, Express
- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui
- **Deployment:** a Linux server

The stack will be filled in as each part is built.

## Project structure

```
docs/
  database/
    drawsql-1-users-courses-payments.sql   users, roles, courses, enrollments, payments
    drawsql-2-course-content.sql           sections, lessons, materials, exams, progress
    setup-timezone-and-triggers.sql        Tashkent time zone, auto-updating updated_at
```

## Database

18 tables, split into two files so each one can be imported into
[drawSQL](https://drawsql.app) as a diagram (the free plan allows 15
tables per diagram). The second file starts with short copies of `users`
and `courses` so its relationships show up in drawSQL. Skip those copies
when creating a real database.

To create the database locally:

```bash
createdb it_live_lms
psql -d it_live_lms -f docs/database/drawsql-1-users-courses-payments.sql
# then run drawsql-2-course-content.sql without its first two tables (users, courses)
psql -d it_live_lms -f docs/database/setup-timezone-and-triggers.sql
```

## What's built

- [x] Database schema
- [ ] Project setup (backend and frontend)
- [ ] Login and roles
- [ ] Admin: users
- [ ] Admin: courses, sections, lessons, materials
- [ ] Student: my courses, lessons, progress
- [ ] Mentor: assignments, exams, grading, results
- [ ] Payments, comments, dashboard stats, certificates, landing page

## Credits

UI design: IT Live Academy (Figma).
