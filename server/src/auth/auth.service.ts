import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { hashCrypto } from '../lib/bycript';
import { generateAccessToken, generateRefreshToken } from '../lib/sendToken';
import { sessionLifetimeMs } from './config';
const userSelect = { id: true, role: true, mustChangePassword: true } satisfies Prisma.UserSelect;
export async function createSession(userId: string, expectedPassword: string) {
  return prisma.$transaction(async tx => {
    // Serializing against password changes prevents a stale login from creating a new session.
    const user = await tx.user.findUnique({ where: { id: userId }, select: { ...userSelect, password: true } });
    if (!user || user.password !== expectedPassword) throw { name: 'Unauthorized' };
    const id = randomUUID();
    const refreshToken = generateRefreshToken();
    await tx.refreshToken.create({ data: { id, userId, hashedToken: hashCrypto(refreshToken), expireAt: new Date(Date.now() + sessionLifetimeMs) } });
    return { accessToken: generateAccessToken({ id: user.id, role: user.role, sid: id }), refreshToken, user: { id: user.id, role: user.role, mustChangePassword: user.mustChangePassword } };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
export async function rotateSession(token: string) {
  return prisma.$transaction(async tx => {
    const session = await tx.refreshToken.findUnique({ where: { hashedToken: hashCrypto(token) }, include: { user: { select: userSelect } } });
    if (!session || session.revoked || session.expireAt <= new Date()) throw { name: 'Unauthorized', message: 'Invalid or expired refresh token.' };
    const refreshToken = generateRefreshToken();
    // Stable session ID keeps existing access tokens valid; compare-and-swap consumes the refresh token once.
    const changed = await tx.refreshToken.updateMany({ where: { id: session.id, hashedToken: hashCrypto(token), revoked: false, expireAt: { gt: new Date() } }, data: { hashedToken: hashCrypto(refreshToken) } });
    if (changed.count !== 1) throw { name: 'Unauthorized', message: 'Refresh token has already been used.' };
    return { accessToken: generateAccessToken({ id: session.user.id, role: session.user.role, sid: session.id }), refreshToken, expiresAt: session.expireAt, user: session.user };
  });
}
export async function revokeSession(token: string) {
  await prisma.refreshToken.updateMany({ where: { hashedToken: hashCrypto(token), revoked: false }, data: { revoked: true } });
}
