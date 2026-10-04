const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { existsSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const entry = path.resolve(__dirname, '../dist/server.js');
const environment = {
  PATH: process.env.PATH,
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
  CLIENT_ORIGIN: 'http://localhost:5173',
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'test-only',
  AWS_SECRET_ACCESS_KEY: 'test-only',
  AWS_BUCKET_NAME: 'test-only',
};

// An empty cwd and explicit environment prevent loading the developer's .env.
async function launch(t, extra) {
  assert.ok(existsSync(entry), 'Run npm run build before this smoke test');
  const cwd = mkdtempSync(path.join(tmpdir(), 'siakad-start-'));
  const child = spawn(process.execPath, [entry], { cwd, env: { ...environment, ...extra } });
  let output = '';
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  const closed = once(child, 'close');
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
    await closed;
    rmSync(cwd, { recursive: true, force: true });
  });
  return { child, closed, output: () => output };
}

test('compiled startup preserves signing-secret validation', { timeout: 10000 }, async t => {
  const app = await launch(t, { JWT_SECRET: '' });
  const [code] = await app.closed;
  assert.notEqual(code, 0);
  assert.match(app.output(), /JWT_SECRET must contain at least 32 bytes/);
});

test('compiled server loads runtime dependencies and serves unauthenticated requests', { timeout: 15000 }, async t => {
  // Port 4000 is fixed by the existing app; refuse to test another process.
  const net = require('node:net');
  const probe = net.createServer();
  probe.listen(4000);
  await once(probe, 'listening');
  await new Promise(resolve => probe.close(resolve));
  const app = await launch(t, { JWT_SECRET: 'test-only-signing-secret-'.repeat(3) });
  const deadline = Date.now() + 10000;
  while (!app.output().includes('Server berjalan')) {
    assert.equal(app.child.exitCode, null, app.output());
    assert.ok(Date.now() < deadline, `Startup timed out: ${app.output()}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const response = await fetch('http://127.0.0.1:4000/api/v1/students', { signal: AbortSignal.timeout(2000) });
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { code: 'TOKEN_INVALID', message: 'Invalid or expired token' });
  assert.equal(app.child.exitCode, null, app.output());
});
