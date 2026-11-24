export const UNIQUE_VIOLATION = "23505";

export const FOREIGN_KEY_VIOLATION = "23503";

export const RESTRICT_VIOLATION = "23001";

export function isStillReferenced(err: unknown) {
  const { code } = pgError(err);
  return code === RESTRICT_VIOLATION || code === FOREIGN_KEY_VIOLATION;
}

interface PgErrorInfo {
  code?: string;
  constraint?: string;
}

export function pgError(err: unknown): PgErrorInfo {
  if (typeof err !== "object" || err === null) return {};

  const info: PgErrorInfo = {};
  if ("code" in err && typeof err.code === "string") info.code = err.code;
  if ("constraint" in err && typeof err.constraint === "string")
    info.constraint = err.constraint;
  return info;
}
