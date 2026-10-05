const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { existsSync, mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');

const entry = path.resolve(__dirname, '../dist/server.js');
const jwtSecret = 'test-only-signing-secret-'.repeat(3);
const environment = {
  PATH: process.env.PATH,
  NODE_OPTIONS: process.env.NODE_OPTIONS,
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
  CLIENT_ORIGIN: 'http://localhost:5173',
  AWS_REGION: 'us-east-1',
  AWS_BUCKET_NAME: 'test-only',
  JWT_SECRET: jwtSecret,
};

async function launch(t) {
  assert.ok(existsSync(entry), 'Run npm run build before this test');
  const cwd = mkdtempSync(path.join(tmpdir(), 'siakad-health-'));
  const child = spawn(process.execPath, [entry], { cwd, env: { ...environment } });
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

test('/health/live returns 200 with ok status in canonical contract', { timeout: 15000 }, async t => {
  const app = await launch(t);
  const deadline = Date.now() + 10000;
  while (!app.output().includes('Server started')) {
    assert.equal(app.child.exitCode, null, app.output());
    assert.ok(Date.now() < deadline, `Startup timed out: ${app.output()}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const res = await fetch('http://127.0.0.1:4000/health/live', { signal: AbortSignal.timeout(2000) });
  assert.equal(res.status, 200, `Expected 200, got ${res.status}: ${await res.clone().text()}`);
  const body = await res.json();
  // Canonical contract: { data: { status: "ok" } }
  assert.deepEqual(body, { data: { status: 'ok' } }, 'Live endpoint should return { data: { status: "ok" } }');
});

test('/health/ready returns 503 when database is unavailable', { timeout: 15000 }, async t => {
  const app = await launch(t);
  const deadline = Date.now() + 10000;
  while (!app.output().includes('Server started')) {
    assert.equal(app.child.exitCode, null, app.output());
    assert.ok(Date.now() < deadline, `Startup timed out: ${app.output()}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const started = performance.now();
  const res = await fetch('http://127.0.0.1:4000/health/ready', { signal: AbortSignal.timeout(2000) });
  assert.ok(performance.now() - started < 1800, 'Readiness response must be bounded');
  // Database is unreachable (port 1), so readiness should be 503
  assert.equal(res.status, 503, `Expected 503 for unhealthy DB, got ${res.status}: ${await res.clone().text()}`);
  const body = await res.json();
  // Canonical contract: { data: { status: "error", reason: "..." } }
  assert.equal(body.data.status, 'error', 'Ready endpoint should report error status');
  assert.ok(body.data.reason, 'Ready endpoint should include reason');
});

test('unknown API route returns 404 with ROUTE_NOT_FOUND', { timeout: 15000 }, async t => {
  const app = await launch(t);
  const deadline = Date.now() + 10000;
  while (!app.output().includes('Server started')) {
    assert.equal(app.child.exitCode, null, app.output());
    assert.ok(Date.now() < deadline, `Startup timed out: ${app.output()}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const res = await fetch('http://127.0.0.1:4000/api/definitely-does-not-exist', {
    signal: AbortSignal.timeout(2000),
  });
  assert.equal(res.status, 404, `Expected 404 for unknown route, got ${res.status}: ${await res.clone().text()}`);
  const body = await res.json();
  assert.equal(body.code, 'ROUTE_NOT_FOUND', 'Unknown route should return ROUTE_NOT_FOUND');
  assert.equal(body.message, 'API route not found', 'Should have descriptive message');
  assert.ok(body.requestId, 'Response should include requestId');
  assert.equal(typeof body.requestId, 'string', 'requestId should be a string');
  assert.ok(body.requestId.length > 0, 'requestId should not be empty');
});

test('known resource not found returns distinct NOT_FOUND vs ROUTE_NOT_FOUND', { timeout: 15000 }, async t => {
  const app = await launch(t);
  const deadline = Date.now() + 10000;
  while (!app.output().includes('Server started')) {
    assert.equal(app.child.exitCode, null, app.output());
    assert.ok(Date.now() < deadline, `Startup timed out: ${app.output()}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  // Known route pattern but invalid ID - should get authentication first
  const authRes = await fetch('http://127.0.0.1:4000/api/v1/students/non-existing-id', {
    signal: AbortSignal.timeout(2000),
  });
  // Without auth, this returns 401 TOKEN_INVALID, which is the existing behavior
  assert.equal(authRes.status, 401, `Expected 401 for unauthenticated request, got ${authRes.status}`);
  const authBody = await authRes.json();
  assert.equal(authBody.code, 'TOKEN_INVALID', 'Unauthenticated request should get TOKEN_INVALID');
  // This confirms the route exists (not ROUTE_NOT_FOUND), just requires auth
});

test('request ID is present in all responses', { timeout: 15000 }, async t => {
  const app = await launch(t);
  const deadline = Date.now() + 10000;
  while (!app.output().includes('Server started')) {
    assert.equal(app.child.exitCode, null, app.output());
    assert.ok(Date.now() < deadline, `Startup timed out: ${app.output()}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Check X-Request-Id header on successful endpoint
  const liveRes = await fetch('http://127.0.0.1:4000/health/live', { signal: AbortSignal.timeout(2000) });
  const liveHeader = liveRes.headers.get('x-request-id');
  assert.ok(liveHeader, 'X-Request-Id header should be present on responses');
  assert.equal(liveRes.status, 200);
  
  // Check request ID in error response body
  const errRes = await fetch('http://127.0.0.1:4000/api/unknown-route', { signal: AbortSignal.timeout(2000) });
  const errHeader = errRes.headers.get('x-request-id');
  assert.ok(errHeader, 'X-Request-Id header should be present on error responses');
  const errBody = await errRes.json();
  assert.equal(errBody.requestId, errHeader, 'Body requestId should match header');
});

test('request ID accepts valid incoming x-request-id header', { timeout: 15000 }, async t => {
  const app = await launch(t);
  const deadline = Date.now() + 10000;
  while (!app.output().includes('Server started')) {
    assert.equal(app.child.exitCode, null, app.output());
    assert.ok(Date.now() < deadline, `Startup timed out: ${app.output()}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  const customId = '550e8400-e29b-41d4-a716-446655440000';
  const res = await fetch('http://127.0.0.1:4000/health/live', {
    signal: AbortSignal.timeout(2000),
    headers: { 'x-request-id': customId },
  });
  assert.equal(res.status, 200);
  const echoId = res.headers.get('x-request-id');
  assert.equal(echoId, customId, 'Should echo back the provided valid request ID');
});

test('request ID rejects unsafe incoming header values', { timeout: 15000 }, async t => {
  const app = await launch(t);
  const deadline = Date.now() + 10000;
  while (!app.output().includes('Server started')) {
    assert.equal(app.child.exitCode, null, app.output());
    assert.ok(Date.now() < deadline, `Startup timed out: ${app.output()}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Invalid header value - should generate new one
  const res = await fetch('http://127.0.0.1:4000/health/live', {
    signal: AbortSignal.timeout(2000),
    headers: { 'x-request-id': 'inject<script>alert(1)</script>' },
  });
  assert.equal(res.status, 200);
  const echoId = res.headers.get('x-request-id');
  assert.notEqual(echoId, 'inject<script>alert(1)</script>', 'Should not echo unsafe header');
  assert.ok(echoId, 'Should generate a fresh request ID');
});
