import 'dotenv/config';
import { CookieOptions } from 'express';
export const sessionLifetimeMs = 24 * 60 * 60 * 1000;
export const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
export const refreshCookieOptions: CookieOptions = {
  httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth',
};
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  // Fail closed; never fall back to a shared development secret.
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET must contain at least 32 bytes.');
  return secret;
}
