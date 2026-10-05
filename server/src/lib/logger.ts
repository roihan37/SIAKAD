import pino from "pino";
import { randomUUID } from "crypto";

/**
 * Structured logger singleton using Pino.
 *
 * Production logs are JSON with sensitive fields redacted.
 * Development logs include colorized pretty output for readability.
 */

const isProduction = process.env.NODE_ENV === "production";

// Redaction configuration - never log sensitive values
const redactPaths = [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers['set-cookie']",
  "jwt",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "databaseUrl",
  "connectionString",
];

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  transport: isProduction
    ? undefined // Production: raw JSON to stdout for container orchestration
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  base: {
    app: "siakad",
    env: process.env.NODE_ENV || "development",
  },
});

/**
 * Create a child logger bound to a request ID for correlation.
 */
export function createRequestLogger(requestId: string): pino.Logger {
  return logger.child({ requestId });
}

/**
 * Log application startup with safe environment diagnostics.
 */
export function logStartup(port: number): void {
  logger.info(
    {
      port,
      env: process.env.NODE_ENV,
      pid: process.pid,
    },
    "Server started"
  );
}

/**
 * Log critical infrastructure failures without exposing secrets.
 */
export function logCriticalFailure(context: string, error: Error): void {
  logger.error(
    {
      context,
      message: error.message,
      code: (error as any).code,
    },
    "Critical failure"
  );
}

export default logger;
