const { test } = require('node:test');
const assert = require('node:assert/strict');
const { requestIdMiddleware } = require('../dist/middleware/requestId');

function invoke(reqOverrides = {}) {
  let nextCalled = false;
  const req = {
    headers: {},
    ...reqOverrides,
  };
  const res = {
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
  };
  const next = () => { nextCalled = true; };
  
  requestIdMiddleware(req, res, next);
  return { req, res, nextCalled };
}

test('requestIdMiddleware sets requestId on request object', () => {
  const { req, nextCalled } = invoke();
  assert.ok(nextCalled, 'next() should be called');
  assert.ok(req.requestId, 'requestId should be set on request');
  assert.equal(typeof req.requestId, 'string');
  assert.ok(req.requestId.length > 0, 'requestId should not be empty');
});

test('requestIdMiddleware sets X-Request-Id header on response', () => {
  const { res } = invoke();
  assert.ok(res.headers['X-Request-Id'], 'X-Request-Id header should be set');
});

test('requestIdMiddleware accepts valid UUID x-request-id header', () => {
  const customId = '550e8400-e29b-41d4-a716-446655440000';
  const { req, res } = invoke({
    headers: { 'x-request-id': customId },
  });
  assert.equal(req.requestId, customId, 'Should accept valid UUID');
  assert.equal(res.headers['X-Request-Id'], customId, 'Should echo back valid UUID');
});

test('requestIdMiddleware accepts valid legacy req_ format', () => {
  const customId = 'req_a1b2c3d4';
  const { req, res } = invoke({
    headers: { 'x-request-id': customId },
  });
  assert.equal(req.requestId, customId, 'Should accept legacy req_ format');
  assert.equal(res.headers['X-Request-Id'], customId, 'Should echo back legacy format');
});

test('requestIdMiddleware rejects unsafe x-request-id headers', () => {
  const unsafeValues = [
    '<script>alert(1)</script>',
    'a'.repeat(100), // too long
    '', // empty
    '   ', // whitespace only
    'not-a-uuid-at-all!!!',
  ];
  
  for (const value of unsafeValues) {
    const { req } = invoke({
      headers: { 'x-request-id': value },
    });
    assert.notEqual(
      req.requestId,
      value,
      `Should reject unsafe value: ${value}`
    );
    assert.ok(/^req_[a-z0-9]{8,16}$/.test(req.requestId) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(req.requestId), 
      `Generated ID should be valid format for input: ${value}`);
  }
});

test('requestIdMiddleware generates unique IDs for separate calls', () => {
  const { req: req1 } = invoke();
  const { req: req2 } = invoke();
  assert.notEqual(req1.requestId, req2.requestId, 'Each call should generate a unique ID');
});

test('requestIdMiddleware handles lowercase header name', () => {
  const customId = '550e8400-e29b-41d4-a716-446655440000';
  const { req, res } = invoke({
    headers: { 'x-request-id': customId },
  });
  assert.equal(req.requestId, customId, 'Should accept lowercase header name');
  assert.equal(res.headers['X-Request-Id'], customId, 'Should echo back with lowercase header');
});

test('requestIdMiddleware generates new ID when no header provided', () => {
  const { req } = invoke({
    headers: {},
  });
  assert.ok(req.requestId, 'Should generate ID when no header provided');
  assert.ok(/^req_[a-z0-9]{8,16}$/.test(req.requestId) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(req.requestId));
});
