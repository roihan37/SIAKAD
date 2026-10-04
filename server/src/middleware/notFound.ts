import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";

/**
 * 404 handler for unknown API routes.
 * Must be placed AFTER all valid API routes so only truly unknown paths reach it.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new AppError(
    404,
    "ROUTE_NOT_FOUND",
    "API route not found"
  );
  next(error);
}
