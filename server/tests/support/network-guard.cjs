// Test-only guard, inherited by subprocesses through NODE_OPTIONS.
// Local HTTP application/credential fixtures are allowed; remote services are not.
const net = require('node:net');
const originalConnect = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const normalized = Array.isArray(args[0]) ? args[0] : args;
  const options = typeof normalized[0] === 'object' ? normalized[0] : { port: normalized[0], host: typeof normalized[1] === 'string' ? normalized[1] : undefined };
  const host = options.host || 'localhost';
  if (options.path || !['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error('Test isolation: non-loopback network connections are disabled');
  }
  return originalConnect.apply(this, args);
};
// All current database suites supply mocks. An incomplete mock must fail, not query.
const pg = require('pg');
pg.Client.prototype.connect = function (callback) {
  const error = new Error('Test isolation: real PostgreSQL connections are disabled; provide a mock');
  // pg-pool needs the callback to release its pending client before pool.end().
  if (typeof callback === 'function') {
    queueMicrotask(() => callback(error));
    return;
  }
  throw error;
};
