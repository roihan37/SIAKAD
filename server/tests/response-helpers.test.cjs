const { test } = require('node:test');
const assert = require('node:assert/strict');
const { sendData, sendCreated, sendPaginated, sendWithData } = require('../dist/lib/responseHelpers');

// Helper to capture response
function captureResponse() {
  const res = {
    _statusCode: 200,
    _body: null,
    status(code) {
      this._statusCode = code;
      return this;
    },
    json(body) {
      this._body = body;
      return this;
    },
  };
  return res;
}

// ============================================================================
// Test Suite: sendData helper
// ============================================================================

test('sendData returns { data } with default 200 status', () => {
  const res = captureResponse();
  const data = { id: 1, name: 'Test' };
  sendData(res, data);
  
  assert.equal(res._statusCode, 200);
  assert.deepEqual(res._body, { data });
});

test('sendData accepts custom status code', () => {
  const res = captureResponse();
  const data = { id: 1 };
  sendData(res, data, 201);
  
  assert.equal(res._statusCode, 201);
  assert.deepEqual(res._body, { data });
});

// ============================================================================
// Test Suite: sendCreated helper
// ============================================================================

test('sendCreated returns { data } with 201 status', () => {
  const res = captureResponse();
  const data = { id: 1, name: 'New Resource' };
  sendCreated(res, data);
  
  assert.equal(res._statusCode, 201);
  assert.deepEqual(res._body, { data });
});

// ============================================================================
// Test Suite: sendPaginated helper
// ============================================================================

test('sendPaginated returns canonical pagination shape', () => {
  const res = captureResponse();
  const data = [{ id: 1 }, { id: 2 }];
  const meta = { page: 1, limit: 10, total: 2, totalPages: 1 };
  
  sendPaginated(res, data, meta);
  
  assert.equal(res._statusCode, 200);
  assert.deepEqual(res._body, {
    data,
    meta
  });
});

test('sendPaginated handles empty array', () => {
  const res = captureResponse();
  const data = [];
  const meta = { page: 1, limit: 10, total: 0, totalPages: 0 };
  
  sendPaginated(res, data, meta);
  
  assert.equal(res._statusCode, 200);
  assert.deepEqual(res._body, { data: [], meta });
});

// ============================================================================
// Test Suite: sendWithData helper
// ============================================================================

test('sendWithData with message includes both fields', () => {
  const res = captureResponse();
  const data = { id: 1 };
  sendWithData(res, data, 'Success message');
  
  assert.equal(res._statusCode, 200);
  assert.deepEqual(res._body, {
    message: 'Success message',
    data
  });
});

test('sendWithData without message omits it', () => {
  const res = captureResponse();
  const data = { id: 1 };
  sendWithData(res, data);
  
  assert.equal(res._statusCode, 200);
  assert.deepEqual(res._body, { data });
});

test('sendWithData accepts custom status code', () => {
  const res = captureResponse();
  const data = { success: true };
  sendWithData(res, data, 'Operation complete', 202);
  
  assert.equal(res._statusCode, 202);
  assert.deepEqual(res._body, {
    message: 'Operation complete',
    data
  });
});
