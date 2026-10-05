import { Response } from "express";

/**
 * Response helper types for the canonical API contract.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Send a single resource response following the canonical contract.
 * Uses { data: {} } shape.
 */
export function sendData(
  res: Response,
  data: unknown,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({ data });
}

/**
 * Send a created resource response with the canonical contract.
 */
export function sendCreated(
  res: Response,
  data: unknown
): Response {
  return res.status(201).json({ data });
}

/**
 * Send a paginated collection response following the canonical contract.
 * Uses { data: [], meta: { page, limit, total, totalPages } } shape.
 */
export function sendPaginated(
  res: Response,
  data: unknown[],
  meta: PaginationMeta
): Response {
  return res.status(200).json({ data, meta });
}

/**
 * Send a response with an optional message and data.
 * Uses { message?: string, data: {} } shape when message is provided.
 */
export function sendWithData(
  res: Response,
  data: unknown,
  message?: string,
  statusCode: number = 200
): Response {
  const body: Record<string, unknown> = { data };
  if (message) {
    body.message = message;
  }
  return res.status(statusCode).json(body);
}
