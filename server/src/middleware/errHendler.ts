import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
) => {
  // Prisma Error
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const meta = error.meta as any

    const fields =
      meta?.target ??
      meta?.driverAdapterError?.cause?.constraint?.fields ??
      []

    const formatFieldName = (text: string) => {
      const field = text.replace(/^["']|["']$/g, "")

      const fieldMap: Record<string, string> = {
        prodiId: "Prodi",
        mataKuliahId: "Mata Kuliah",
        kurikulumId: "Kurikulum",
        fakultasId: "Fakultas",
        tahunAkademikId: "Tahun Akademik",
      }

      return (
        fieldMap[field] ??
        field
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) =>
            char.toUpperCase()
          )
      )
    }

    const formatDuplicateMessage = (
      fields: string[]
    ) => {
      const names = fields.map(formatFieldName)

      // Jadikan semua field setelah field pertama lowercase
      const formattedNames = names.map(
        (name, index) =>
          index === 0
            ? name
            : name.toLowerCase()
      )

      if (formattedNames.length === 1) {
        return `${formattedNames[0]} sudah terdaftar`
      }

      if (formattedNames.length === 0) return "Data sudah terdaftar";

      if (formattedNames.length === 2) {
        return `${formattedNames[0]} dan ${formattedNames[1]} sudah terdaftar`
      }

      const last =
        formattedNames[formattedNames.length - 1]

      const first =
        formattedNames.slice(0, -1).join(", ")

      return `${first} dan ${last} sudah terdaftar`
    }

    return res.status(409).json({
      code: "DUPLICATE_DATA",
      message: Array.isArray(fields)
        ? formatDuplicateMessage(fields)
        : "Data sudah terdaftar",
    })
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2003":
        return res.status(409).json({
          code: "CONFLICT",
          message: "Operasi tidak dapat dilakukan karena data memiliki relasi yang masih digunakan atau referensi tidak valid",
        });
      case "P2034":
        return res.status(409).json({
          code: "CONFLICT",
          message: "Data sedang berubah, silakan ulangi operasi",
        });
      case "P2025":
        return res.status(404).json({
          code: "NOT_FOUND",
          message: "Data yang akan diproses tidak ditemukan",
        });
    }
  }

  switch (error.name) {
    case "TokenExpiredError":
      return res.status(401).json({
        code: "TOKEN_EXPIRED",
        message: "Access token expired",
      });

    case "badRequest":
    case "BadRequest":
    case "LecturerValidationError":
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: error.message || "Email / Password is required",
      });

    case "Conflict":
      return res.status(409).json({ code: "CONFLICT", message: error.message || "Data masih digunakan." });

    case "LecturerInUse":
      return res.status(409).json({
        code: "CONFLICT",
        message: error.message || "Dosen masih memiliki mahasiswa bimbingan atau kelas mengajar. Pindahkan relasi tersebut sebelum menghapus dosen.",
      });

    case "LecturerStatusConflict":
      return res.status(409).json({
        code: "CONFLICT",
        message: error.message || "Data dosen sedang berubah, silakan ulangi pembaruan status",
      });

    case "Unauthorized":
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: error.message || "Invalid Email / Password",
      });

    case "Forbidden":
      return res.status(403).json({
        code: "FORBIDDEN",
        message: error.message || "Akses ditolak",
      });

    case "TokenInvalid":
      return res.status(401).json({
        code: "TOKEN_INVALID",
        message: "Invalid or expired token",
      });

    case "NotFound":
      return res.status(404).json({
        code: "NOT_FOUND",
        message: error.message || "Data not found",
      });

    default:
      console.error(error);

      return res.status(500).json({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal Server Error",
      });
  }
};
