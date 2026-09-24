import { RequestHandler } from 'express';
import { clientOrigin } from '../auth/config';
// Browser cookie mutations must originate from the configured UI. Non-browser clients may omit Origin.
export const trustedOrigin: RequestHandler = (req, res, next) => {
  if ((req.headers.origin && req.headers.origin !== clientOrigin) || req.headers['sec-fetch-site'] === 'cross-site') return next({ name: 'Forbidden', message: 'Untrusted request origin.' });
  next();
};
// Single-process limiter. Deploy a shared limiter at the gateway when running multiple instances.
export function authRateLimit(limit: number): RequestHandler {
  const windows = new Map<string, { count: number; expiresAt: number }>();
  const timer = setInterval(() => { for (const [key, value] of windows) if (value.expiresAt <= Date.now()) windows.delete(key); }, 60000);
  timer.unref();
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = windows.get(key);
    if (!entry || entry.expiresAt <= now) { entry = { count: 0, expiresAt: now + 15 * 60000 }; windows.set(key, entry); }
    if (++entry.count > limit) { res.setHeader('Retry-After', Math.ceil((entry.expiresAt - now) / 1000)); return next({ name: 'TooManyRequests', message: 'Too many authentication attempts. Please try later.' }); }
    next();
  };
}
