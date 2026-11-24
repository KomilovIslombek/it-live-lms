import { appendFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const LOG_DIR = fileURLToPath(new URL("../../logs/", import.meta.url));
const ERROR_LOG = `${LOG_DIR}error.log`;

function now() {
  return new Date().toLocaleString("sv-SE", { timeZone: "Asia/Tashkent" });
}

export function logError(context: string, err: unknown) {
  const details =
    err instanceof Error ? (err.stack ?? err.message) : String(err);
  const entry = `[${now()}] ${context}\n${details}\n\n`;

  console.error(entry);

  mkdir(LOG_DIR, { recursive: true })
    .then(() => appendFile(ERROR_LOG, entry))
    .catch((fileErr: unknown) => {
      console.error("Could not write to the error log:", fileErr);
    });
}
