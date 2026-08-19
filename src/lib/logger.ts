/**
 * Minimal structured logger. Emits one JSON object per line so it can be
 * picked up by any log pipeline (CloudWatch, Datadog, etc.) without a
 * dedicated library. Swap the `write` function for a real transport later.
 */
type Level = "info" | "warn" | "error";

interface LogFields {
  requestId?: string;
  [key: string]: unknown;
}

function write(level: Level, event: string, fields: LogFields = {}) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};
