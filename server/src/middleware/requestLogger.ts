import { Request, Response, NextFunction } from "express";
import { createRequestLogger } from "../lib/logger";

/**
 * HTTP request logging middleware.
 *
 * Logs method, path, status, duration, and requestId for every request.
 * Uses Pino for structured JSON output with redaction of sensitive headers.
 *
 * Does NOT log:
 * - Request/response bodies (can contain PII)
 * - Authorization headers (redacted by Pino config)
 * - Cookie headers (redacted by Pino config)
 */
export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = process.hrtime.bigint();
  const requestId = req.requestId;
  
  // Create child logger with request ID bound
  const log = createRequestLogger(requestId);

  // Log request on completion
  res.on("finish", () => {
    const durationNs = process.hrtime.bigint() - start;
    const durationMs = Number(durationNs) / 1_000_000;

    // Determine log level based on status code
    // 4xx (except 404) are expected client errors, log at info
    // 404 is normal route handling, log at debug
    // 5xx are unexpected server errors, log at error
    const statusCode = res.statusCode;
    let level: "debug" | "info" | "warn" | "error" = "info";
    
    if (statusCode >= 500) {
      level = "error";
    } else if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 404) {
        level = "debug";
      } else {
        level = "info";
      }
    }

    log[level](
      {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode,
        durationMs: Math.round(durationMs * 100) / 100, // 2 decimal places
      },
      `${req.method} ${req.originalUrl || req.url} ${statusCode} ${durationMs.toFixed(2)}ms`
    );
  });

  next();
}
