const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('../dist/errors/app-error');
const { errorHandler } = require('../dist/middleware/errHendler');

function invoke(error) {
  let statusCode;
  let body;
  const res = { status(code) { statusCode = code; return this; }, json(value) { body = value; return this; } };
  errorHandler(error, {}, res, () => undefined);
  return { statusCode, body };
}

test('AppError preserves stable status, code, message, details and stack', () => {
  const error = new AppError(404, 'STUDENT_NOT_FOUND', 'Mahasiswa tidak ditemukan', { details: { field: 'studentId' } });
  assert.equal(error instanceof Error, true);
  assert.match(error.stack, /AppError/);
  assert.equal(error.isOperational, true);
  assert.deepEqual(invoke(error), { statusCode: 404, body: { code: 'STUDENT_NOT_FOUND', message: 'Mahasiswa tidak ditemukan', details: { field: 'studentId' } } });
});

test('unknown errors become a safe generic response', () => {
  const originalError = console.error;
  console.error = () => undefined;
  const result = invoke(new Error('DATABASE_URL=postgresql://secret@db/internal SQL password=secret'));
  console.error = originalError;
  assert.equal(result.statusCode, 500);
  assert.deepEqual(result.body, { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' });
  assert.equal(JSON.stringify(result.body).includes('secret'), false);
  assert.equal(JSON.stringify(result.body).includes('stack'), false);
});

test('legacy named errors preserve frontend message compatibility', () => {
  assert.deepEqual(invoke({ name: 'BadRequest', message: 'Input tidak valid' }), { statusCode: 400, body: { code: 'VALIDATION_ERROR', message: 'Input tidak valid' } });
  assert.deepEqual(invoke({ name: 'TokenInvalid' }), { statusCode: 401, body: { code: 'TOKEN_INVALID', message: 'Invalid or expired token' } });
});

test('AppError validation details remain structured', () => {
  assert.deepEqual(invoke(new AppError(400, 'VALIDATION_ERROR', 'Input tidak valid', { details: { email: ['Format email tidak valid'] } })).body, {
    code: 'VALIDATION_ERROR', message: 'Input tidak valid', details: { email: ['Format email tidak valid'] },
  });
});
