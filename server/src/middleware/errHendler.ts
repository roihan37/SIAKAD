import { Prisma } from "@prisma/client";
import { ErrorRequestHandler, Request, Response } from "express";
import { AppError } from "../errors/app-error";

type LegacyError = { name?: string; message?: string };
type ExpressRequest = Request & { requestId?: string };

/**
 * Generate a safe request ID for correlation. Uses crypto when available,
 * otherwise falls back to Math.random. Never exposes raw secrets.
 */
function generateRequestId(): string {
  try {
    const crypto = require("crypto");
    return `req_${crypto.randomBytes(8).toString("hex")}`;
  } catch {
    return `req_${Math.random().toString(36).substring(2, 14)}`;
  }
}

function response(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
  requestId?: string,
) {
  const payload: Record<string, unknown> = {
    code,
    message,
    requestId: requestId || generateRequestId(),
  };
  if (details && Object.keys(details).length > 0) {
    payload.details = details;
  }
  res.status(statusCode).json(payload);
  return res;
}

function prismaDuplicateFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const meta = error.meta;
  if (!meta || typeof meta !== "object") return [];
  const target = (meta as { target?: unknown }).target;
  return Array.isArray(target) && target.every((field): field is string => typeof field === "string") ? target : [];
}

function duplicateMessage(fields: string[]): string {
  const labels: Record<string, string> = {
    prodiId: "Prodi",
    mataKuliahId: "Mata Kuliah",
    kurikulumId: "Kurikulum",
    fakultasId: "Fakultas",
    tahunAkademikId: "Tahun Akademik",
  };
  const names = fields.map((field) =>
    labels[field] ?? field.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
  );
  if (names.length === 0) return "Data sudah terdaftar";
  if (names.length === 1) return `${names[0]} sudah terdaftar`;
  if (names.length === 2) return `${names[0]} dan ${names[1].toLowerCase()} sudah terdaftar`;
  const last = names[names.length - 1];
  return `${names.slice(0, -1).join(", ")} dan ${last.toLowerCase()} sudah terdaftar`;
}

function legacyResponse(error: LegacyError, res: Response, requestId?: string): Response | undefined {
  const message = error.message;
  switch (error.name) {
    case "TokenExpiredError":
      return response(res, 401, "TOKEN_EXPIRED", "Access token expired", undefined, requestId);
    case "badRequest":
    case "BadRequest":
    case "LecturerValidationError":
      return response(res, 400, "VALIDATION_ERROR", message || "Email / Password is required", undefined, requestId);
    case "Conflict":
    case "LecturerInUse":
    case "LecturerStatusConflict":
      return response(res, 409, "CONFLICT", message || "Data masih digunakan.", undefined, requestId);
    case "Unauthorized":
      return response(res, 401, "INVALID_CREDENTIALS", message || "Invalid Email / Password", undefined, requestId);
    case "Forbidden":
      return response(res, 403, "FORBIDDEN", message || "Akses ditolak", undefined, requestId);
    case "TooManyRequests":
      return response(res, 429, "RATE_LIMITED", message || "Too many requests", undefined, requestId);
    case "PasswordChangeRequired":
      return response(res, 403, "PASSWORD_CHANGE_REQUIRED", message || "Change your password before continuing.", undefined, requestId);
    case "JsonWebTokenError":
    case "NotBeforeError":
    case "TokenInvalid":
      return response(res, 401, "TOKEN_INVALID", "Invalid or expired token", undefined, requestId);
    case "NotFound":
      return response(res, 404, "NOT_FOUND", message || "Data not found", undefined, requestId);
    default:
      return undefined;
  }
}

/**
 * Centralized error handler middleware.
 *
 * Priority order:
 * 1. AppError instances → use their statusCode, code, message, details
 * 2. Prisma known errors → map to appropriate HTTP status
 * 3. Legacy named objects → backward-compatible mapping
 * 4. Unknown errors → safe 500 with no leaking information
 *
 * Production responses never include:
 * - stack traces
 * - Prisma internals
 * - SQL queries
 * - filesystem paths
 * - environment variables
 * - secrets
 */
export const errorHandler: ErrorRequestHandler = (error: unknown, req: ExpressRequest, res: Response): void => {
  // Use request-scoped requestId if available
  const requestId = req.requestId;

  // 1. Handle typed AppError instances
  if (error instanceof AppError) {
    response(res, error.statusCode, error.code, error.message, error.details, requestId);
    return;
  }

  // 2. Handle Prisma known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        response(res, 409, "DUPLICATE_DATA", duplicateMessage(prismaDuplicateFields(error)), undefined, requestId);
        return;
      case "P2003":
        response(res, 409, "CONFLICT", "Operasi tidak dapat dilakukan karena data memiliki relasi yang masih digunakan atau referensi tidak valid", undefined, requestId);
        return;
      case "P2034":
        response(res, 409, "CONFLICT", "Data sedang berubah, silakan ulangi operasi", undefined, requestId);
        return;
      case "P2025":
        response(res, 404, "NOT_FOUND", "Data yang akan diproses tidak ditemukan", undefined, requestId);
        return;
      default:
        break;
    }
  }

  // 3. Handle legacy named error objects for backward compatibility
  const known = legacyResponse(typeof error === "object" && error !== null ? (error as LegacyError) : {}, res, requestId);
  if (known) {
    return;
  }

  // 4. Unknown/unexpected errors: log internally, return safe 500
  if (error instanceof Error) {
    console.error("[ERROR]", error.message);
  } else {
    console.error("[ERROR]", String(error ?? "unknown error"));
  }

  response(res, 500, "INTERNAL_SERVER_ERROR", "Internal Server Error", undefined, requestId);
};
