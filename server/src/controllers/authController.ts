import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { comparePassword } from '../lib/bycript';
import { createSession, rotateSession, revokeSession } from '../auth/auth.service';
import { refreshCookieOptions, sessionLifetimeMs } from '../auth/config';
import { credentials, newPassword } from '../auth/validation';
// Equal-cost comparison for unknown accounts reduces identifier enumeration by timing.
const dummyHash = bcrypt.hashSync('unusable-login-placeholder', 10);
function cookieToken(req: Request): string | null {
  const token = req.cookies?.refreshToken;
  return typeof token === 'string' && /^[A-Za-z0-9_-]{22,128}$/.test(token) ? token : null;
}
function clearSessionCookie(res: Response) {
  res.clearCookie('refreshToken', refreshCookieOptions);
  // Remove cookies issued by the previous root-path implementation during migration.
  res.clearCookie('refreshToken', { ...refreshCookieOptions, path: '/' });
}
export class Controller {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier, password } = credentials(req.body);
      const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] }, select: { id: true, password: true } });
      const matches = await comparePassword(password, user?.password ?? dummyHash);
      if (!user || !matches) throw { name: 'Unauthorized' };
      const result = await createSession(user.id, user.password);
      clearSessionCookie(res);
      res.cookie('refreshToken', result.refreshToken, { ...refreshCookieOptions, maxAge: sessionLifetimeMs });
      return res.status(200).json({ accessToken: result.accessToken, user: result.user });
    } catch (error) { next(error); }
  }
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = cookieToken(req);
      if (!token) throw { name: 'Unauthorized', message: 'Missing refresh token.' };
      const result = await rotateSession(token);
      res.cookie('refreshToken', result.refreshToken, { ...refreshCookieOptions, expires: result.expiresAt });
      return res.status(200).json({ accessToken: result.accessToken, user: result.user });
    } catch (error) {
      // Do not erase a freshly rotated cookie when a parallel request loses the rotation race.
      next(error);
    }
  }
  static async revokeRefreshTokens(req: Request, res: Response, next: NextFunction) {
    try {
      const token = cookieToken(req);
      if (token) await revokeSession(token);
      clearSessionCookie(res);
      return res.status(200).json({ message: 'Logout successfully.' });
    } catch (error) { next(error); }
  }
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userLogin.id;
      const { password: currentPassword } = credentials({ identifier: userId, password: req.body?.currentPassword });
      const password = newPassword(req.body?.newPassword);
      if (password === currentPassword) throw { name: 'BadRequest', message: 'New password must differ from the current password.' };
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } });
      if (!user || !await comparePassword(currentPassword, user.password)) throw { name: 'Unauthorized' };
      const hash = await bcrypt.hash(password, 10);
      await prisma.$transaction(async tx => {
        const changed = await tx.user.updateMany({ where: { id: userId, password: user.password }, data: { password: hash, mustChangePassword: false } });
        if (changed.count !== 1) throw { name: 'Conflict', message: 'Password has changed. Sign in again.' };
        await tx.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      clearSessionCookie(res);
      return res.status(200).json({ message: 'Password changed. Please sign in again.' });
    } catch (error) { next(error); }
  }
}
