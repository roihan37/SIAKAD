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
    const meta = error.meta as any;

    const fields =
      meta?.target ??
      meta?.driverAdapterError?.cause?.constraint?.fields ??
      [];

    // console.log("DUPLICATE FIELDS:", fields);

    return res.status(409).json({
      code: "DUPLICATE_DATA",
      message: Array.isArray(fields)
        ? `${fields.join(", ")} sudah terdaftar`
        : "Data sudah terdaftar",
    });
  }

  switch (error.name) {
    case "TokenExpiredError":
      return res.status(401).json({
        code: "TOKEN_EXPIRED",
        message: "Access token expired",
      });

    case "badRequest":
      return res.status(400).json({
        code: "VALIDATION_ERROR",
        message: "Email / Password is required",
      });

    case "Unauthorized":
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: error.message || "Invalid Email / Password",
      });

    case "TokenInvalid":
      return res.status(401).json({
        code: "TOKEN_INVALID",
        message: "Invalid or expired token",
      });

    case "NotFound":
      return res.status(404).json({
        code: "NOT_FOUND",
        message: "Data not found",
      });

    default:
      console.error(error);

      return res.status(500).json({
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal Server Error",
      });
  }
};