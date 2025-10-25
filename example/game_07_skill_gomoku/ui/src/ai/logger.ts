const TIMESTAMP_PREFIX = "[game07][ai]";

type LogLevel = "info" | "warn" | "error";

const formatMessage = (message: unknown): string => {
  const base =
    typeof message === "string" ? message.trim() : String(message ?? "");
  return base;
};

const emit = (level: LogLevel, message?: unknown, ...args: unknown[]) => {
  const timestamp = new Date().toISOString();
  const parts: unknown[] = [`[${timestamp}]${TIMESTAMP_PREFIX}`];
  if (message !== undefined) {
    parts.push(formatMessage(message));
  }
  if (args.length > 0) {
    parts.push(...args);
  }

  // eslint-disable-next-line no-console
  console[level](...parts);
};

export const aiLog = {
  info: (message?: unknown, ...args: unknown[]) => emit("info", message, ...args),
  warn: (message?: unknown, ...args: unknown[]) => emit("warn", message, ...args),
  error: (message?: unknown, ...args: unknown[]) => emit("error", message, ...args),
};

