const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'test-only-secret-'.repeat(4);
const { createTokenJwt, decoded } = require('../src/lib/jwt');
const { hashPassword, hashCrypto } = require('../src/lib/bycript');
const { prisma } = require('../src/lib/prisma');
const { createSession, rotateSession, revokeSession } = require('../src/auth/auth.service');
const { authMiddleware } = require('../src/middleware/authMid');
const { credentials, newPassword } = require('../src/auth/validation');
const { trustedOrigin, authRateLimit } = require('../src/middleware/authProtection');
const { errorHandler } = require('../src/middleware/errHendler');
async function main() {
  const claims = { id: 'user', role: 'Admin', sid: 'session', password: 'must-not-leak', email: 'private' };
  const token = createTokenJwt(claims);
  const payload = jwt.decode(token);
  assert.equal(payload.password, undefined); assert.equal(payload.email, undefined); assert.deepEqual(decoded(token), { id: 'user', role: 'Admin', sid: 'session' });
  assert.throws(() => decoded(jwt.sign(claims, 'wrong-secret')));
  assert.throws(() => decoded(jwt.sign({ id: 'user' }, process.env.JWT_SECRET, { issuer: 'siakad', audience: 'siakad-api' })));
  assert.notEqual(hashPassword('same-password'), hashPassword('same-password'));
  for (const body of [null, { identifier: {}, password: 'x' }, { identifier: 'u', password: {} }, { identifier: 'u', password: 'a'.repeat(73) }]) assert.throws(() => credentials(body));
  assert.throws(() => newPassword('short'));
  const user = { id: 'user', role: 'Admin', password: 'hash', mustChangePassword: false };
  const sessions = [];
  const tx = {
    user: { findUnique: async () => user },
    refreshToken: {
      create: async ({ data }) => { sessions.push({ ...data, revoked: false }); },
      findUnique: async ({ where }) => { const row = sessions.find(x => where.id ? x.id === where.id : x.hashedToken === where.hashedToken); return row ? { ...row, user } : null; },
      updateMany: async ({ where, data }) => {
        const rows = sessions.filter(x => (!where.id || x.id === where.id) && (!where.hashedToken || x.hashedToken === where.hashedToken) && (where.revoked === undefined || x.revoked === where.revoked) && (!where.expireAt || x.expireAt > where.expireAt.gt));
        rows.forEach(x => Object.assign(x, data)); return { count: rows.length };
      },
    },
  };
  prisma.$transaction = async fn => fn(tx);
  prisma.refreshToken.findUnique = tx.refreshToken.findUnique;
  prisma.refreshToken.updateMany = tx.refreshToken.updateMany;
  const first = await createSession('user', 'hash');
  const second = await createSession('user', 'hash');
  assert.equal(sessions.length, 2); assert.equal(first.user.password, undefined);
  const rotated = await rotateSession(first.refreshToken);
  assert.notEqual(rotated.refreshToken, first.refreshToken);
  await assert.rejects(() => rotateSession(first.refreshToken), e => e.name === 'Unauthorized');
  assert.equal(sessions[1].revoked, false);
  // Compare-and-swap permits exactly one consumer of the same refresh token.
  const race = await Promise.allSettled([rotateSession(rotated.refreshToken), rotateSession(rotated.refreshToken)]);
  assert.equal(race.filter(x => x.status === 'fulfilled').length, 1);
  const active = race.find(x => x.status === 'fulfilled').value;
  const request = { headers: { authorization: `Bearer ${active.accessToken}` }, originalUrl: '/api/v1/admin/dashboard' };
  let error;
  await authMiddleware(request, {}, e => { error = e; }); assert.equal(error, undefined); assert.equal(request.userLogin.role, 'Admin');
  user.mustChangePassword = true;
  await authMiddleware(request, {}, e => { error = e; }); assert.equal(error.name, 'PasswordChangeRequired');
  await authMiddleware({ ...request, originalUrl: '/api/v1/auth/change-password' }, {}, e => { error = e; }); assert.equal(error, undefined);
  user.mustChangePassword = false;
  await revokeSession(active.refreshToken);
  await authMiddleware(request, {}, e => { error = e; }); assert.equal(error.name, 'TokenInvalid');
  assert.equal(sessions[1].revoked, false);
  sessions[1].expireAt = new Date(0);
  await assert.rejects(() => rotateSession(second.refreshToken), e => e.name === 'Unauthorized');
  await assert.rejects(() => createSession('user', 'old-password'), e => e.name === 'Unauthorized');
  trustedOrigin({ headers: { origin: 'https://untrusted.example' } }, {}, e => { error = e; }); assert.equal(error.name, 'Forbidden');
  const limiter = authRateLimit(1); const req = { ip: 'test', socket: {}, headers: {} }; const res = { setHeader() {} };
  limiter(req, res, e => { error = e; }); assert.equal(error, undefined); limiter(req, res, e => { error = e; }); assert.equal(error.name, 'TooManyRequests');
  let status;
  errorHandler(new jwt.JsonWebTokenError('invalid'), {}, { status(code) { status = code; return this; }, json() {} }, () => {}); assert.equal(status, 401);
  console.log('PASS: JWT allowlist/signatures, unique salts, input checks, session isolation, refresh race/replay, immediate revocation, password-change gate, origin/rate limits (mock database)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
