const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync } = require('node:fs');
const net = require('node:net');

test('test runner uses explicit dummy configuration and no developer env file', () => {
  assert.equal(process.env.NODE_ENV, 'test');
  assert.equal(process.env.DATABASE_URL, 'postgresql://test:test@127.0.0.1:1/siakad_test');
  assert.equal(process.env.AWS_ACCESS_KEY_ID, undefined);
  assert.equal(process.env.AWS_SECRET_ACCESS_KEY, undefined);
  assert.equal(existsSync('.env'), false);
});

test('external sockets fail before any connection, including normalized Node arguments', () => {
  for (const args of [[{ host: 'example.invalid', port: 443 }], [443, 'example.invalid'], [[{ host: 'example.invalid', port: 443 }]]]) {
    const socket = new net.Socket();
    assert.throws(() => socket.connect(...args), /Test isolation/);
    socket.destroy();
  }
});

test('unmocked PostgreSQL connections fail before querying any database', () => {
  const { Client } = require('pg');
  assert.throws(() => new Client().connect(), /real PostgreSQL connections are disabled/);
});
