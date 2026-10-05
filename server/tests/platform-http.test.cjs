const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { once } = require('node:events');

for (const tree of ['src', 'dist']) {
  test(`${tree}: Express handles health, auth, 404 and internal failures with correlated JSON`, async t => {
    const { requestIdMiddleware } = require(`../${tree}/middleware/requestId`);
    const { errorHandler } = require(`../${tree}/middleware/errHendler`);
    const router = require(`../${tree}/router`).default;
    const { prisma } = require(`../${tree}/lib/prisma`);
    const { createTokenJwt } = require(`../${tree}/lib/jwt`);
    const originalQuery = prisma.$queryRaw;
    const originalSession = prisma.refreshToken.findUnique;
    prisma.$queryRaw = async () => [{ '?column?': 1 }];
    prisma.refreshToken.findUnique = async () => ({
      userId: 'platform-admin', revoked: false, expireAt: new Date(Date.now() + 60000),
      user: { id: 'platform-admin', role: 'Admin', mustChangePassword: false },
    });
    t.after(() => { prisma.$queryRaw = originalQuery; prisma.refreshToken.findUnique = originalSession; });
    const app = express();
    app.use(requestIdMiddleware);
    app.use(express.json());
    app.get('/fixture-internal-error', async () => { throw new Error('private failure details'); });
    app.use(router);
    app.use(errorHandler);
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    async function check(path, status, code, options) {
      const response = await fetch(base + path, { signal: AbortSignal.timeout(2000), ...options });
      const bodyText = await response.text();
      assert.equal(response.status, status, bodyText);
      assert.match(response.headers.get('content-type'), /application\/json/);
      const body = JSON.parse(bodyText);
      assert.ok(response.headers.get('x-request-id'));
      if (code) {
        assert.equal(body.code, code);
        assert.equal(body.requestId, response.headers.get('x-request-id'));
        assert.ok(!bodyText.includes('private failure details'));
      }
      return body;
    }
    assert.deepEqual(await check('/health/live', 200), { data: { status: 'ok' } });
    assert.deepEqual(await check('/health/ready', 200), { data: { status: 'ok' } });
    const protectedNames = ['admin', 'users', 'students', 'lecturers', 'fakultas', 'prodi', 'avatars', 'ruangan', 'tahun-akademik', 'kelas', 'kurikulum', 'mata-kuliah', 'kelas-mata-kuliah', 'jadwal', 'krs'];
    for (const name of protectedNames) await check(`/api/v1/${name}`, 401, 'TOKEN_INVALID');
    await check('/api/unknown', 404, 'ROUTE_NOT_FOUND');
    const token = createTokenJwt({ id: 'platform-admin', sid: 'platform-session', role: 'Admin' });
    await check('/api/unknown', 404, 'ROUTE_NOT_FOUND', { headers: { authorization: `Bearer ${token}` } });
    await check('/api/v1/students/not/a/route', 404, 'ROUTE_NOT_FOUND', { headers: { authorization: `Bearer ${token}` } });
    await check('/fixture-internal-error', 500, 'INTERNAL_SERVER_ERROR');
    await check('/api/v1/students', 500, 'INTERNAL_SERVER_ERROR', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{',
    });
    prisma.$queryRaw = async () => { throw new Error('private failure details'); };
    assert.deepEqual(await check('/health/ready', 503), { data: { status: 'error', reason: 'Service Unavailable' } });
  });
}

test('readiness deadline shares pending work, tolerates late rejection and recovers', async () => {
  const { createReadinessCheck } = require('../src/router/health');
  let calls = 0;
  let reject;
  const hanging = new Promise((_, fail) => { reject = fail; });
  const check = createReadinessCheck(() => { calls++; return calls === 1 ? hanging : Promise.resolve(); }, 25);
  const started = performance.now();
  assert.deepEqual(await Promise.all([check(), check(), check()]), [false, false, false]);
  assert.ok(performance.now() - started < 1000);
  assert.equal(calls, 1);
  assert.equal(await check(), false);
  assert.equal(calls, 1);
  reject(new Error('private database error'));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(await check(), true);
  assert.equal(calls, 2);
});

test('database isolation guard fails pool connections without trapping shutdown', async () => {
  const { Pool } = require('pg');
  const pool = new Pool();
  await assert.rejects(pool.query('SELECT 1'), /real PostgreSQL connections are disabled/);
  assert.equal(pool.totalCount, 0);
  await pool.end();
});
