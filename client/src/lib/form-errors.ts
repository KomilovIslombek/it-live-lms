import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError, errorMessage } from "./api";

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
) {
  if (error instanceof ApiError && error.details) {
    let matched = false;
    for (const [field, messages] of Object.entries(error.details)) {
      if (fields.includes(field as Path<T>) && messages?.[0]) {
        setError(field as Path<T>, { message: messages[0] });
        matched = true;
      }
    }
    if (matched) return;
  }
  setError("root.server" as Path<T>, { message: errorMessage(error) });
}
