import { Prisma } from "@prisma/client";
import { ErrorRequestHandler, Response } from "express";
import { AppError } from "../errors/app-error";

type LegacyError = { name?: string; message?: string };

function response(res: Response, statusCode: number, code: string, message: string, details?: Record<string, unknown>) {
  const payload = { code, message, ...(details ? { details } : {}) };
  res.status(statusCode).json(payload);
  return res;
}

function prismaDuplicateFields(error: Prisma.PrismaClientKnownRequestError): string[] {
  const meta = error.meta;
  if (!meta || typeof meta !== "object") return [];
  const target = (meta as { target?: unknown }).target;
  return Array.isArray(target) && target.every((field): field is string => typeof field === "string") ? target : [];
}

function duplicateMessage(fields: string[]) {
  const labels: Record<string, string> = { prodiId: "Prodi", mataKuliahId: "Mata Kuliah", kurikulumId: "Kurikulum", fakultasId: "Fakultas", tahunAkademikId: "Tahun Akademik" };
  const names = fields.map((field) => labels[field] ?? field.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()));
  if (names.length === 0) return "Data sudah terdaftar";
  if (names.length === 1) return `${names[0]} sudah terdaftar`;
  if (names.length === 2) return `${names[0]} dan ${names[1].toLowerCase()} sudah terdaftar`;
  const last = names[names.length - 1];
  return `${names.slice(0, -1).join(", ")} dan ${last.toLowerCase()} sudah terdaftar`;
}

function legacyResponse(error: LegacyError, res: Response) {
  const message = error.message;
  switch (error.name) {
    case "TokenExpiredError": return response(res, 401, "TOKEN_EXPIRED", "Access token expired");
    case "badRequest":
    case "BadRequest":
    case "LecturerValidationError": return response(res, 400, "VALIDATION_ERROR", message || "Email / Password is required");
    case "Conflict":
    case "LecturerInUse":
    case "LecturerStatusConflict": return response(res, 409, "CONFLICT", message || "Data masih digunakan.");
    case "Unauthorized": return response(res, 401, "INVALID_CREDENTIALS", message || "Invalid Email / Password");
    case "Forbidden": return response(res, 403, "FORBIDDEN", message || "Akses ditolak");
    case "TooManyRequests": return response(res, 429, "RATE_LIMITED", message || "Too many requests");
    case "PasswordChangeRequired": return response(res, 403, "PASSWORD_CHANGE_REQUIRED", message || "Change your password before continuing.");
    case "JsonWebTokenError":
    case "NotBeforeError":
    case "TokenInvalid": return response(res, 401, "TOKEN_INVALID", "Invalid or expired token");
    case "NotFound": return response(res, 404, "NOT_FOUND", message || "Data not found");
    default: return undefined;
  }
}

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res) => {
  if (error instanceof AppError) return response(res, error.statusCode, error.code, error.message, error.details);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": return response(res, 409, "DUPLICATE_DATA", duplicateMessage(prismaDuplicateFields(error)));
      case "P2003": return response(res, 409, "CONFLICT", "Operasi tidak dapat dilakukan karena data memiliki relasi yang masih digunakan atau referensi tidak valid");
      case "P2034": return response(res, 409, "CONFLICT", "Data sedang berubah, silakan ulangi operasi");
      case "P2025": return response(res, 404, "NOT_FOUND", "Data yang akan diproses tidak ditemukan");
      default: break;
    }
  }

  const known = legacyResponse(typeof error === "object" && error !== null ? error as LegacyError : {}, res);
  if (known) return known;
  if (error instanceof Error) console.error(error);
  return response(res, 500, "INTERNAL_SERVER_ERROR", "Internal Server Error");
};
