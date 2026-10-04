const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AppError } = require('../dist/errors/app-error');
const { errorHandler } = require('../dist/middleware/errHendler');
const { Prisma } = require('@prisma/client');

function invoke(error) {
  let statusCode;
  let body;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      body = value;
      return this;
    },
  };
  errorHandler(error, {}, res, () => undefined);
  return { statusCode, body };
}

/** Helper to create a mock Prisma known error */
function makePrismaError(code, meta) {
  const err = new Error(`Prisma ${code}`);
  err.code = code;
  err.meta = meta || {};
  Object.setPrototypeOf(err, Prisma.PrismaClientKnownRequestError.prototype);
  return err;
}

// ============================================================================
// Test Suite 1: Known AppError Flow
// ============================================================================

test('AppError preserves stable status, code, message, details and stack', () => {
  const error = new AppError(404, 'STUDENT_NOT_FOUND', 'Mahasiswa tidak ditemukan', {
    details: { field: 'studentId' },
  });
  assert.equal(error instanceof Error, true, 'AppError should extend Error');
  assert.match(error.stack, /AppError/, 'Stack trace should include class name');
  assert.equal(error.isOperational, true, 'Default isOperational should be true');
  assert.equal(error.name, 'AppError', 'Error name should be AppError');
  assert.equal(error.statusCode, 404, 'Status code should match constructor');
  assert.equal(error.code, 'STUDENT_NOT_FOUND', 'Code should match constructor');
  assert.equal(error.message, 'Mahasiswa tidak ditemukan', 'Message should match constructor');
  assert.deepEqual(error.details, { field: 'studentId' }, 'Details should be preserved');

  const result = invoke(error);
  assert.equal(result.statusCode, 404, 'HTTP status should be 404');
  assert.equal(result.body.code, 'STUDENT_NOT_FOUND', 'Error code should match');
  assert.equal(result.body.message, 'Mahasiswa tidak ditemukan', 'Message should be human-readable');
  assert.deepEqual(result.body.details, { field: 'studentId' }, 'Details should be in response');
  assert.ok(result.body.requestId, 'Response should include requestId');
});

test('AppError with no details omits details field from response', () => {
  const error = new AppError(404, 'NOT_FOUND', 'Resource not found');
  const result = invoke(error);
  assert.equal(result.statusCode, 404);
  assert.equal(result.body.code, 'NOT_FOUND');
  assert.equal(result.body.message, 'Resource not found');
  assert.equal(result.body.details, undefined, 'Details should be omitted when not provided');
});

test('AppError preserves non-true isOperational flag', () => {
  const error = new AppError(500, 'SERVICE_DOWN', 'Service unavailable', { isOperational: false });
  assert.equal(error.isOperational, false, 'isOperational should be false');
  const result = invoke(error);
  assert.equal(result.statusCode, 500);
  assert.equal(result.body.code, 'SERVICE_DOWN');
});

test('AppError with multiple detail fields preserves all structured data', () => {
  const error = new AppError(422, 'VALIDATION_MULTIPLE', 'Multiple validation failures', {
    details: {
      email: ['Format invalid'],
      phone: ['Too short'],
      age: ['Must be positive'],
    },
  });
  const result = invoke(error);
  assert.equal(result.statusCode, 422);
  assert.deepEqual(result.body.details, {
    email: ['Format invalid'],
    phone: ['Too short'],
    age: ['Must be positive'],
  });
});

// ============================================================================
// Test Suite 2: Unknown/Error Flow → 500
// ============================================================================

test('unknown Error becomes safe generic 500 response', () => {
  const originalConsoleError = console.error;
  let capturedLog;
  console.error = (...args) => { capturedLog = args.join(' '); };

  const result = invoke(new Error('DATABASE_URL=postgresql://secret@db/internal'));

  console.error = originalConsoleError;

  assert.equal(result.statusCode, 500, 'Should return 500');
  assert.equal(result.body.code, 'INTERNAL_SERVER_ERROR', 'Should use INTERNAL_SERVER_ERROR code');
  assert.equal(result.body.message, 'Internal Server Error', 'Should have generic message');
  assert.ok(result.body.requestId, 'Should include requestId');
  assert.ok(!JSON.stringify(result.body).includes('secret'), 'Must not leak secrets');
  assert.ok(!JSON.stringify(result.body).includes('stack'), 'Must not expose stack');
  assert.ok(capturedLog.includes('DATABASE_URL'), 'Internal log should contain raw error for debugging');
});

test('non-Error object without name becomes safe 500', () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = invoke({ something: 'random', noName: true });
  console.error = originalConsoleError;

  assert.equal(result.statusCode, 500, 'Should return 500 for unknown objects');
  assert.equal(result.body.code, 'INTERNAL_SERVER_ERROR');
});

test('null error becomes safe 500', () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = invoke(null);
  console.error = originalConsoleError;

  assert.equal(result.statusCode, 500);
  assert.equal(result.body.code, 'INTERNAL_SERVER_ERROR');
});

test('string error becomes safe 500', () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = invoke('Something went wrong');
  console.error = originalConsoleError;

  assert.equal(result.statusCode, 500);
  assert.equal(result.body.code, 'INTERNAL_SERVER_ERROR');
});

test('numeric error becomes safe 500', () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = invoke(42);
  console.error = originalConsoleError;

  assert.equal(result.statusCode, 500);
  assert.equal(result.body.code, 'INTERNAL_SERVER_ERROR');
});

// ============================================================================
// Test Suite 3: Backward Compatibility
// ============================================================================

test('legacy named errors preserve frontend message compatibility', () => {
  // BadRequest variations
  let result = invoke({ name: 'BadRequest', message: 'Input tidak valid' });
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.code, 'VALIDATION_ERROR');
  assert.equal(result.body.message, 'Input tidak valid');
  assert.ok(typeof result.body.requestId === 'string');

  result = invoke({ name: 'badRequest', message: 'Bad input' });
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.code, 'VALIDATION_ERROR');

  // TokenInvalid
  result = invoke({ name: 'TokenInvalid' });
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.code, 'TOKEN_INVALID');
  assert.equal(result.body.message, 'Invalid or expired token');

  // NotFound with custom message
  result = invoke({ name: 'NotFound', message: 'Data tidak ditemukan' });
  assert.equal(result.statusCode, 404);
  assert.equal(result.body.code, 'NOT_FOUND');
  assert.equal(result.body.message, 'Data tidak ditemukan');

  // Unauthorized
  result = invoke({ name: 'Unauthorized' });
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.code, 'INVALID_CREDENTIALS');

  // Forbidden
  result = invoke({ name: 'Forbidden', message: 'Akses ditolak' });
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.code, 'FORBIDDEN');

  // Conflict
  result = invoke({ name: 'Conflict', message: 'Data konflik' });
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, 'CONFLICT');

  // TokenExpiredError
  result = invoke({ name: 'TokenExpiredError' });
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.code, 'TOKEN_EXPIRED');

  // PasswordChangeRequired
  result = invoke({ name: 'PasswordChangeRequired', message: 'Change password' });
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.code, 'PASSWORD_CHANGE_REQUIRED');
});

test('legacy names without message use fallback messages', () => {
  let result = invoke({ name: 'NotFound' });
  assert.equal(result.statusCode, 404);
  assert.equal(result.body.code, 'NOT_FOUND');
  assert.equal(result.body.message, 'Data not found');

  result = invoke({ name: 'Unauthorized' });
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.code, 'INVALID_CREDENTIALS');
  assert.equal(result.body.message, 'Invalid Email / Password');

  result = invoke({ name: 'Forbidden' });
  assert.equal(result.statusCode, 403);
  assert.equal(result.body.code, 'FORBIDDEN');
  assert.equal(result.body.message, 'Akses ditolak');

  result = invoke({ name: 'Conflict' });
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, 'CONFLICT');
  assert.equal(result.body.message, 'Data masih digunakan.');
});

test('unknown legacy names fall through to 500', () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = invoke({ name: 'SomeUnknownError', message: 'Something happened' });
  console.error = originalConsoleError;

  assert.equal(result.statusCode, 500);
  assert.equal(result.body.code, 'INTERNAL_SERVER_ERROR');
});

// ============================================================================
// Test Suite 4: Validation and Details Behavior
// ============================================================================

test('AppError validation details remain structured', () => {
  const result = invoke(
    new AppError(400, 'VALIDATION_ERROR', 'Input tidak valid', {
      details: { email: ['Format email tidak valid'], password: ['Minimal 12 karakter'] },
    }),
  );
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.code, 'VALIDATION_ERROR');
  assert.equal(result.body.message, 'Input tidak valid');
  assert.deepEqual(result.body.details, {
    email: ['Format email tidak valid'],
    password: ['Minimal 12 karakter'],
  });
});

test('AppError with empty details object still works', () => {
  const error = new AppError(400, 'VALIDATION_ERROR', 'Validasi gagal', { details: {} });
  const result = invoke(error);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.details, undefined, 'Empty details should be omitted');
});

test('AppError with nested structured details', () => {
  const error = new AppError(400, 'VALIDATION_NESTED', 'Nested validation', {
    details: {
      form: {
        email: ['Invalid format'],
        fields: [{ name: 'age', rule: 'min', value: -1 }],
      },
    },
  });
  const result = invoke(error);
  assert.equal(result.statusCode, 400);
  assert.ok(typeof result.body.details === 'object');
});

// ============================================================================
// Test Suite 5: Security - No Information Leakage
// ============================================================================

test('production responses never expose sensitive information', () => {
  const sensitiveData = [
    'password=',
    'secret',
    'apikey',
    'token=eyJ',
    '/home/',
    'C:\\Users\\',
    'DATABASE_URL',
    'JWT_SECRET',
    'AWS_SECRET',
  ];

  const errors = [
    new Error('Password=secret123 in connection string'),
    new Error('API key: sk_test_abc123 exposed'),
    { name: 'UnknownError', message: 'Path: /etc/passwd read failed' },
    'Error: Cannot access /var/secrets/env',
    new Error('SQL: SELECT * FROM users WHERE password="admin123"'),
  ];

  for (const err of errors) {
    const originalConsoleError = console.error;
    console.error = () => {};
    const result = invoke(err);
    console.error = originalConsoleError;

    const bodyStr = JSON.stringify(result.body);
    for (const sentinel of sensitiveData) {
      assert.ok(
        !bodyStr.includes(sentinel),
        `Response must not contain "${sentinel}" in ${JSON.stringify(result.body)}`,
      );
    }
  }
});

test('requestId is a non-empty string with expected format', () => {
  const result1 = invoke(new Error('test'));
  const result2 = invoke(new Error('test2'));

  assert.ok(typeof result1.body.requestId === 'string', 'requestId should be string');
  assert.ok(result1.body.requestId.length > 0, 'requestId should not be empty');
  assert.ok(typeof result2.body.requestId === 'string', 'requestId should be string');
  assert.ok(result1.body.requestId.startsWith('req_'), 'requestId should start with req_');
});

test('multiple requests get different requestIds', () => {
  const results = [];
  for (let i = 0; i < 5; i++) {
    results.push(invoke(new Error(`test ${i}`)).body.requestId);
  }
  // At least some should be different
  const unique = new Set(results);
  assert.ok(unique.size >= 2, 'Should generate different requestIds');
});

// ============================================================================
// Test Suite 6: Prisma Error Handling
// ============================================================================

test('Prisma P2002 duplicate field error is handled', () => {
  const prismaError = makePrismaError('P2002', { target: ['email'] });
  const result = invoke(prismaError);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, 'DUPLICATE_DATA');
  assert.ok(typeof result.body.message === 'string', 'Message should be localized');
  // Message should mention duplicate/register
  assert.ok(
    result.body.message.includes('terdaftar') || result.body.message.includes('Prodi') || result.body.message.includes('Mata Kuliah'),
    `Message should be contextual: ${result.body.message}`,
  );
});

test('Prisma P2002 with multiple duplicate fields', () => {
  const prismaError = makePrismaError('P2002', { target: ['prodiId', 'mataKuliahId'] });
  const result = invoke(prismaError);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, 'DUPLICATE_DATA');
  assert.ok(result.body.message.includes('Prodi') && result.body.message.includes('mata kuliah'),
    `Message should mention both fields: ${result.body.message}`);
});

test('Prisma P2002 with no target metadata', () => {
  const prismaError = makePrismaError('P2002', {});
  const result = invoke(prismaError);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, 'DUPLICATE_DATA');
  assert.equal(result.body.message, 'Data sudah terdaftar');
});

test('Prisma P2003 foreign key constraint error', () => {
  const prismaError = makePrismaError('P2003', { target: ['class_id'] });
  const result = invoke(prismaError);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, 'CONFLICT');
  assert.ok(result.body.message.includes(' relasi ') || result.body.message.includes('referensi'),
    `Message should mention relation/reference: ${result.body.message}`);
});

test('Prisma P2034 optimistic concurrency conflict', () => {
  const prismaError = makePrismaError('P2034', {});
  const result = invoke(prismaError);
  assert.equal(result.statusCode, 409);
  assert.equal(result.body.code, 'CONFLICT');
  assert.ok(result.body.message.includes('berubah') || result.body.message.includes('lakukan'),
    `Message should indicate concurrent modification: ${result.body.message}`);
});

test('Prisma P2025 record not found error', () => {
  const prismaError = makePrismaError('P2025', {});
  const result = invoke(prismaError);
  assert.equal(result.statusCode, 404);
  assert.equal(result.body.code, 'NOT_FOUND');
  assert.ok(result.body.message.includes('ditemukan') || result.body.message.includes('tidak'),
    `Message should indicate not found: ${result.body.message}`);
});

test('unknown Prisma error falls through to legacy handler', () => {
  const prismaError = makePrismaError('P9999', {});
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = invoke(prismaError);
  console.error = originalConsoleError;

  assert.equal(result.statusCode, 500);
  assert.equal(result.body.code, 'INTERNAL_SERVER_ERROR');
});

// ============================================================================
// Test Suite 7: Edge Cases
// ============================================================================

test('empty object becomes safe 500', () => {
  const originalConsoleError = console.error;
  console.error = () => {};
  const result = invoke({});
  console.error = originalConsoleError;

  assert.equal(result.statusCode, 500);
  assert.equal(result.body.code, 'INTERNAL_SERVER_ERROR');
});

test('error with undefined message defaults to generic message', () => {
  const result = invoke({ name: 'NotFound' });
  assert.equal(result.statusCode, 404);
  assert.equal(result.body.message, 'Data not found');
});

test('response contains required fields for frontend compatibility', () => {
  const result = invoke(new AppError(404, 'TEST_CODE', 'Test message'));
  assert.ok('code' in result.body, 'Response must have code field');
  assert.ok('message' in result.body, 'Response must have message field');
  assert.ok('requestId' in result.body, 'Response must have requestId field');
  assert.equal(typeof result.body.code, 'string');
  assert.equal(typeof result.body.message, 'string');
});

test('AppError with custom statusCode and code', () => {
  const error = new AppError(422, 'SEMANTIC_ERROR', 'Semantically invalid input', {
    details: { field: 'quantity', reason: 'negative' },
  });
  const result = invoke(error);
  assert.equal(result.statusCode, 422);
  assert.equal(result.body.code, 'SEMANTIC_ERROR');
  assert.equal(result.body.message, 'Semantically invalid input');
  assert.deepEqual(result.body.details, { field: 'quantity', reason: 'negative' });
});

test('error handling preserves HTTP method independence', () => {
  // The error handler should work regardless of request method
  const error = new AppError(400, 'BAD_REQUEST', 'Bad request');
  const result = invoke(error);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.code, 'BAD_REQUEST');
});
