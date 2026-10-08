import type { Response } from "express";
import { refreshCookieOptions } from "./config";

export function clearSessionCookie(res: Response) {
  res.clearCookie("refreshToken", refreshCookieOptions);
  // Remove cookies issued by the previous root-path implementation during migration.
  res.clearCookie("refreshToken", { ...refreshCookieOptions, path: "/" });
}
