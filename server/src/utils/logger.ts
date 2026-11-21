import { appendFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// server/logs/, found from this file's own location (src/utils/ while
// developing, dist/utils/ after a build), so it doesn't matter which
// folder the server was started from.
const LOG_DIR = fileURLToPath(new URL("../../logs/", import.meta.url));
const ERROR_LOG = `${LOG_DIR}error.log`;

// "2026-11-21 13:46:53" in Tashkent time, easier to read than UTC.
function now() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Tashkent" });
}

// Writes an error to the terminal and appends it to server/logs/error.log.
// `context` says where it happened, e.g. "POST /api/v1/auth/login".
// Never pass request bodies here: they can contain passwords.
export function logError(context: string, err: unknown) {
  const details =
    err instanceof Error ? (err.stack ?? err.message) : String(err);
  const entry = `[${now()}] ${context}\n${details}\n\n`;

  console.error(entry);

  // Not awaited: the response doesn't wait for the disk. If writing fails,
  // say so in the terminal instead of crashing the server.
  mkdir(LOG_DIR, { recursive: true })
    .then(() => appendFile(ERROR_LOG, entry))
    .catch((fileErr: unknown) => {
      console.error("Could not write to the error log:", fileErr);
    });
}
