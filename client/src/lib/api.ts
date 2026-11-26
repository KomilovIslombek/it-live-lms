export type FieldErrors = Record<string, string[] | undefined>;

export class ApiError extends Error {
  status: number;
  details?: FieldErrors;

  constructor(status: number, message: string, details?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Query;
}

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const search = params.toString();
  return `/api/v1${path}${search ? `?${search}` : ""}`;
}

export async function api<T>(
  path: string,
  { method = "GET", body, query }: RequestOptions = {},
): Promise<T> {
  const isForm = body instanceof FormData;
  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: "same-origin",
      headers: body && !isForm ? { "Content-Type": "application/json" } : {},
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Is it running?");
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data.error === "string"
        ? data.error
        : response.status >= 500
          ? "The server isn't responding. Try again in a moment."
          : `Request failed (${response.status})`;
    throw new ApiError(response.status, message, data?.details);
  }

  return data as T;
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
