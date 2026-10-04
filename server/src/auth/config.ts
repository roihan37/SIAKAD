import { getEnv } from '../config/env';
import { CookieOptions } from 'express';
export const sessionLifetimeMs = 24 * 60 * 60 * 1000;
export const clientOrigin = getEnv().CLIENT_ORIGIN;
export const refreshCookieOptions: CookieOptions = {
  httpOnly: true, secure: getEnv().NODE_ENV === 'production', sameSite: 'strict', path: '/api/v1/auth',
};
export function jwtSecret(): string {
  return getEnv().JWT_SECRET;
}
