// PostgreSQL reports what went wrong with a 5-character code, plus the name
// of the constraint that stopped the query. Full list of codes:
// https://www.postgresql.org/docs/current/errcodes-appendix.html

// INSERT/UPDATE with a value that must be unique and already exists
// (for example the same slug twice).
export const UNIQUE_VIOLATION = "23505";

// INSERT/UPDATE with a foreign key that points to a row that doesn't exist
// (a course with category_id 999). Also a DELETE of a row that other rows
// still use, when the foreign key is ON DELETE NO ACTION (the default).
export const FOREIGN_KEY_VIOLATION = "23503";

// DELETE of a row that other rows still use, when the foreign key is
// ON DELETE RESTRICT (our schema: a category that has courses, a course
// that has payments). A different code from the one above: checked by
// testing, the first version only caught 23503 and answered 500.
export const RESTRICT_VIOLATION = "23001";

// "Other rows still point to this one", whichever of the two rules is used.
export function isStillReferenced(err: unknown) {
  const { code } = pgError(err);
  return code === RESTRICT_VIOLATION || code === FOREIGN_KEY_VIOLATION;
}

interface PgErrorInfo {
  code?: string;
  constraint?: string;
}

// The error from node-postgres is typed `unknown` in a catch block, so check
// its shape step by step before reading the fields.
export function pgError(err: unknown): PgErrorInfo {
  if (typeof err !== "object" || err === null) return {};

  const info: PgErrorInfo = {};
  if ("code" in err && typeof err.code === "string") info.code = err.code;
  if ("constraint" in err && typeof err.constraint === "string")
    info.constraint = err.constraint;
  return info;
}
