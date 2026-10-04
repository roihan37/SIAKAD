import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_PATTERN = /^[a-f0-9-]{36}$/; // UUID v4 format
const MAX_REQUEST_ID_LENGTH = 64;

/**
 * Generates a safe request ID.
 * Uses crypto.randomUUID when available (Node 14.17+), falls back to Math.random.
 */
function generateRequestId(): string {
  try {
    const crypto = require("crypto");
    if (typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `req_${crypto.randomBytes(8).toString("hex")}`;
  } catch {
    return `req_${Math.random().toString(36).substring(2, 14)}`;
  }
}

/**
 * Validates an incoming request ID header.
 * Only accepts safe UUID-format values to prevent injection.
 */
function isValidRequestId(value: string): boolean {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.length > MAX_REQUEST_ID_LENGTH) return false;
  // Accept standard UUID format or our legacy req_ prefix format
  return REQUEST_ID_PATTERN.test(value) || /^req_[a-z0-9]{8,16}$/.test(value);
}

/**
 * Get header value case-insensitively from Express request headers.
 * Express normalizes headers to lowercase, but we handle both cases for safety.
 */
function getHeader(req: Request, name: string): string | undefined {
  // Express normalizes to lowercase
  const lowerName = name.toLowerCase();
  return req.headers[lowerName] as string | undefined;
}

/**
 * Request ID middleware.
 * - Accepts a trusted x-request-id header if present and valid
 * - Otherwise generates a new UUID
 * - Stores it on req.requestId for downstream use
 */
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let requestId: string;

  const incoming = getHeader(req, REQUEST_ID_HEADER);
  if (incoming && typeof incoming === "string") {
    const trimmed = incoming.trim();
    if (isValidRequestId(trimmed)) {
      requestId = trimmed;
    } else {
      // Invalid header value — ignore and generate fresh
      requestId = generateRequestId();
    }
  } else {
    requestId = generateRequestId();
  }

  req.requestId = requestId;
  // Echo the ID back so clients can correlate requests
  res.setHeader("X-Request-Id", requestId);
  next();
}
