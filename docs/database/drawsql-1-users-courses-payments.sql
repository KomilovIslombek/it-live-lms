-- IT Live LMS: database diagram, part 1 of 2 (users, courses, payments)
-- 8 tables. Import into drawsql.app as PostgreSQL.
-- Part 2 (course content and learning) is in drawsql-2-course-content.sql.

CREATE TABLE "roles"(
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "roles" ADD CONSTRAINT "roles_title_unique" UNIQUE("title");
COMMENT
ON COLUMN
    "roles"."title" IS 'admin, mentor, assistant, student';

CREATE TABLE "users"(
    "id" SERIAL PRIMARY KEY,
    "role_id" INTEGER NOT NULL,
    "email" VARCHAR(255) NULL,
    "phone" VARCHAR(255) NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT TRUE,
    "profile_img" VARCHAR(255) NULL,
    "job" VARCHAR(255) NULL,
    "experience" INTEGER NULL,
    "website" VARCHAR(255) NULL,
    "info" TEXT NULL,
    "facebook" VARCHAR(255) NULL,
    "telegram" VARCHAR(255) NULL,
    "linkedin" VARCHAR(255) NULL,
    "instagram" VARCHAR(255) NULL,
    "github" VARCHAR(255) NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
ALTER TABLE
    "users" ADD CONSTRAINT "users_phone_unique" UNIQUE("phone");
COMMENT
ON COLUMN
    "users"."password_hash" IS 'bcrypt hash, never the plain password';
COMMENT
ON COLUMN
    "users"."status" IS 'Active or inactive (Faol / Nofaol)';
COMMENT
ON COLUMN
    "users"."job" IS 'Mentor profile fields: job, experience, website, info, social links';

CREATE TABLE "categories"(
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT NULL,
    "status" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "categories" ADD CONSTRAINT "categories_slug_unique" UNIQUE("slug");
COMMENT
ON COLUMN
    "categories"."slug" IS 'URL-friendly name';

CREATE TABLE "levels"(
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NULL,
    "status" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "levels" ADD CONSTRAINT "levels_slug_unique" UNIQUE("slug");
COMMENT
ON COLUMN
    "levels"."title" IS 'Beginner, Intermediate, Advanced';

CREATE TABLE "courses"(
    "id" SERIAL PRIMARY KEY,
    "banner" VARCHAR(255) NOT NULL,
    "intro_video" VARCHAR(255) NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "price" NUMERIC(12, 2) NOT NULL,
    "level_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "courses" ADD CONSTRAINT "courses_price_check" CHECK("price" >= 0);
COMMENT
ON COLUMN
    "courses"."price" IS 'In UZS. NUMERIC is exact (not a float); 12,2 allows up to 9 999 999 999.99';

CREATE TABLE "user_courses"(
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "course_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "user_courses" ADD CONSTRAINT "user_courses_user_id_course_id_unique" UNIQUE("user_id", "course_id");
COMMENT
ON COLUMN
    "user_courses"."created_at" IS 'Enrollment date. A student can enroll in a course only once (online only)';

CREATE TABLE "payment_methods"(
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(255) NOT NULL,
    "description" TEXT NULL,
    "logo" VARCHAR(255) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT TRUE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "payment_methods" ADD CONSTRAINT "payment_methods_code_unique" UNIQUE("code");
COMMENT
ON COLUMN
    "payment_methods"."name" IS 'Online methods only: Payme, Click, Uzum';
COMMENT
ON COLUMN
    "payment_methods"."code" IS 'Stable key used in code: payme, click, uzum';
COMMENT
ON COLUMN
    "payment_methods"."logo" IS 'Logo image URL/path';

CREATE TABLE "payments"(
    "id" SERIAL PRIMARY KEY,
    "course_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "payment_method_id" INTEGER NOT NULL,
    "amount" NUMERIC(12, 2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'UZS',
    "transaction_id" VARCHAR(255) NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMPTZ NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE
    "payments" ADD CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id");
ALTER TABLE
    "payments" ADD CONSTRAINT "payments_amount_check" CHECK("amount" > 0);
ALTER TABLE
    "payments" ADD CONSTRAINT "payments_currency_check" CHECK("currency" IN ('UZS', 'USD'));
ALTER TABLE
    "payments" ADD CONSTRAINT "payments_status_check" CHECK("status" IN ('pending', 'succeeded', 'failed', 'refunded'));
COMMENT
ON COLUMN
    "payments"."user_id" IS 'User who made the payment';
COMMENT
ON COLUMN
    "payments"."transaction_id" IS 'Id from the payment provider. Empty until the provider returns it';
COMMENT
ON COLUMN
    "payments"."paid_at" IS 'Empty while pending or failed';

-- Deleting a role, category or level that is still in use is blocked (RESTRICT).
-- Enrollments disappear with their user or course (CASCADE).
-- Payments are financial records: a user or course with payments cannot be
-- deleted (RESTRICT). Deactivate it with status = false instead.
ALTER TABLE
    "users" ADD CONSTRAINT "users_role_id_foreign" FOREIGN KEY("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;
ALTER TABLE
    "courses" ADD CONSTRAINT "courses_category_id_foreign" FOREIGN KEY("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT;
ALTER TABLE
    "courses" ADD CONSTRAINT "courses_level_id_foreign" FOREIGN KEY("level_id") REFERENCES "levels"("id") ON DELETE RESTRICT;
ALTER TABLE
    "user_courses" ADD CONSTRAINT "user_courses_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE
    "user_courses" ADD CONSTRAINT "user_courses_course_id_foreign" FOREIGN KEY("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
ALTER TABLE
    "payments" ADD CONSTRAINT "payments_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id") ON DELETE RESTRICT;
ALTER TABLE
    "payments" ADD CONSTRAINT "payments_course_id_foreign" FOREIGN KEY("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT;
ALTER TABLE
    "payments" ADD CONSTRAINT "payments_payment_method_id_foreign" FOREIGN KEY("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE RESTRICT;
