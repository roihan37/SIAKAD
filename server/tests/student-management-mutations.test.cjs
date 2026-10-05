const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const plain = value => JSON.parse(JSON.stringify(value));
function load(file, imports) {
  const context = { exports: {}, console: { error() {} }, require(name) {
    if (!(name in imports)) throw new Error(`Unexpected dependency ${name}`);
    return imports[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return context.exports;
}
function fixture(options = {}) {
  const events = [], writes = [];
  const failure = { code: 'P2002', message: 'duplicate' };
  const users = options.users ?? [{ id: 'u1', name: 'Student', avatarKey: 'avatar', mahasiswa: { id: 'm1', status: 'Aktif' } }];
  const operation = (name, result) => async args => {
    events.push(name); writes.push([name, plain(args)]);
    if (options.fail === name) throw failure;
    return result;
  };
  const tx = {
    user: { create: operation('user.create', { id: 'u1', name: 'Student' }),
      findUnique: operation('user.findUnique', users[0] ?? null), findMany: operation('user.findMany', users),
      delete: operation('user.delete', {}), deleteMany: operation('user.deleteMany', { count: options.count ?? users.length }) },
    mahasiswa: { create: operation('mahasiswa.create', {}), update: operation('mahasiswa.update', {}) },
    riwayatStatusMahasiswa: { create: operation('history.create', {}) },
    transkrip: { deleteMany: operation('transkrip.delete', {}) },
    kRSDetail: { deleteMany: operation('detail.delete', {}) },
    kRS: { deleteMany: operation('krs.delete', {}) },
  };
  const prisma = { async $transaction(fn, config) {
    assert.equal(config.isolationLevel, 'RepeatableRead'); events.push('begin');
    try { const result = await fn(tx); if (options.fail === 'commit') throw failure; events.push('commit'); return result; }
    catch (error) { events.push('rollback'); throw error; }
  } };
  let active = 0, maximum = 0;
  const S3Service = { async deleteUrl(key) {
    assert.ok(events.includes('commit')); events.push(`s3:${key}`); active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setImmediate(resolve)); active--;
    if (options.cleanupFails) throw new Error('storage unavailable');
  } };
  const AvatarService = {
    verifyKey: operation('verify', undefined),
    getPublicUrl(key) { events.push('url'); return `public:${key}`; },
    async deleteObject(key) { events.push(`cleanup:${key}`); if (options.cleanupFails) throw new Error('cleanup unavailable'); },
  };
  const { StudentManagementService: service } = load('services/student-management.service.ts', {
    '@prisma/client': { Prisma: { TransactionIsolationLevel: { RepeatableRead: 'RepeatableRead' } } },
    '../lib/prisma': { prisma }, '../lib/bycript': { hashPassword(password) {
      events.push('hash'); if (options.fail === 'hash') throw failure; return `hashed:${password}`;
    } }, './avatar.service': { AvatarService }, './s3.service': { S3Service },
  });
  const { Controller } = load('controllers/studentController.ts', {
    '../services/student-management.service': { StudentManagementService: service },
    ...Object.fromEntries(['../lib/prisma', '../lib/bycript', '@prisma/client', '../services/avatar.service',
      '../services/s3.service', '../validation/master-data', '../services/attendance.service', '../services/tuition.service',
      '../services/student-finance.service', '../services/student-account.service', '../services/student-attendance.service',
      '../services/student-academic.service'].map(name => [name, {}])),
  });
  return { service, Controller, events, writes, failure, maximum: () => maximum };
}
async function invoke(f, method, body = {}, id = 'u1') {
  let status, response, error;
  await f.Controller[method]({ body, params: { id } }, {
    status(value) { status = value; return this; }, json(value) { response = plain(value); },
  }, value => { error = value; });
  return { status, response, error };
}
const body = { name: 'Student', email: 'student@example.test', username: 'student', password: 'short',
  nik: 'nik', birthPlace: 'City', birthDate: '2000-01-01', gender: 'Male', address: 'Address', phoneNumber: '123',
  nim: '123', angkatan: 2026, semester: 1, status: 'Cuti', prodiId: 2, dosenId: 'd1', avatarKey: 'avatar' };
test('create preserves fields, hashing, optional relations, transaction order and response; no initial history', async () => {
  const f = fixture();
  assert.deepEqual(await invoke(f, 'createStudent', body), { status: 201, response: { message: 'Student created successfully' }, error: undefined });
  assert.deepEqual(f.events, ['begin', 'hash', 'verify', 'url', 'user.create', 'mahasiswa.create', 'commit']);
  const { nim, angkatan, semester, status, prodiId, dosenId, ...user } = body;
  assert.deepEqual(f.writes.find(([name]) => name === 'user.create')[1].data,
    { ...user, password: 'hashed:short', role: 'Mahasiswa', avatarUrl: 'public:avatar' });
  assert.deepEqual(f.writes.find(([name]) => name === 'mahasiswa.create')[1].data,
    { nim, angkatan, semester, status, prodiId, dosenId, userId: 'u1' });
  const noAvatar = fixture(); await noAvatar.service.createStudent({ ...body, avatarKey: undefined, dosenId: undefined });
  assert.ok(!noAvatar.events.includes('verify')); assert.ok(!noAvatar.events.some(e => e.startsWith('cleanup:')));
});
for (const fail of ['hash', 'verify', 'user.create', 'mahasiswa.create', 'commit']) {
  test(`create ${fail} failure rolls back, attempts avatar cleanup and preserves original error`, async () => {
    const f = fixture({ fail, cleanupFails: true });
    const result = await invoke(f, 'createStudent', body);
    assert.equal(result.error, f.failure); assert.equal(result.response, undefined);
    assert.deepEqual(f.events.slice(-2), ['rollback', 'cleanup:avatar']);
  });
}
test('single delete preserves child-to-parent order and untrimmed ID; cleanup failure still succeeds', async () => {
  const f = fixture({ cleanupFails: true });
  assert.deepEqual(await invoke(f, 'deleteUserById', {}, ' u1 '), { status: 200, response: { message: 'Student berhasil dihapus' }, error: undefined });
  assert.deepEqual(f.events, ['begin', 'user.findUnique', 'transkrip.delete', 'detail.delete', 'krs.delete', 'user.delete', 'commit', 's3:avatar']);
  assert.deepEqual(f.writes[0][1].where, { id: ' u1 ', role: 'Mahasiswa' });
});
for (const method of ['deleteUserById', 'bulkDelete']) {
  for (const options of [{ users: [] }, { users: [{ id: 'u1', mahasiswa: null }] }, { fail: 'transkrip.delete' }, { fail: 'detail.delete' }, { fail: 'krs.delete' }, { fail: method === 'bulkDelete' ? 'user.deleteMany' : 'user.delete' }, { fail: 'commit' }]) {
    test(`${method} ${JSON.stringify(options)} never cleans storage on database failure`, async () => {
      const f = fixture(options); const result = await invoke(f, method, { ids: ['u1'] });
      assert.ok(result.error); assert.equal(result.response, undefined);
      assert.equal(f.events.at(-1), 'rollback'); assert.ok(!f.events.some(e => e.startsWith('s3:')));
    });
  }
}
test('delete validation retains direct 400 envelope without transactions', async () => {
  for (const id of ['', ' ', [], undefined]) {
    const f = fixture(); const result = await invoke(f, 'deleteUserById', {}, id === undefined ? null : id);
    assert.deepEqual(result.response, { code: 'VALIDATION_ERROR', message: 'ID user mahasiswa wajib diisi' });
    assert.equal(result.status, 400); assert.deepEqual(f.events, []);
  }
  for (const ids of [undefined, [], [' '], [1], Array(101).fill('u1')]) {
    const f = fixture(); const result = await invoke(f, 'bulkDelete', { ids });
    assert.equal(result.status, 400); assert.equal(result.response.code, 'VALIDATION_ERROR'); assert.deepEqual(f.events, []);
  }
});
test('bulk delete deduplicates IDs/keys, limits cleanup to five, continues after storage failures', async () => {
  const users = Array.from({ length: 9 }, (_, i) => ({ id: `u${i}`, mahasiswa: { id: `m${i}` }, avatarKey: i === 8 ? 'key0' : `key${i}` }));
  const f = fixture({ users, cleanupFails: true }); const ids = users.map(u => u.id);
  const result = await invoke(f, 'bulkDelete', { ids: [...ids, ' u0 '] });
  assert.deepEqual(result, { status: 200, response: { message: '9 mahasiswa berhasil dihapus', data: { deletedCount: 9, ids } }, error: undefined });
  assert.deepEqual(f.writes.at(-1)[1].where, { id: { in: ids }, role: 'Mahasiswa' });
  assert.equal(f.events.filter(e => e.startsWith('s3:')).length, 8); assert.equal(f.maximum(), 5);
  assert.deepEqual(f.events.slice(0, 7), ['begin', 'user.findMany', 'transkrip.delete', 'detail.delete', 'krs.delete', 'user.deleteMany', 'commit']);
  const mismatch = fixture({ count: 0 }); assert.equal((await invoke(mismatch, 'bulkDelete', { ids: ['u1'] })).error.name, 'NotFound');
  assert.equal(mismatch.events.at(-1), 'rollback');
});
test('bulk status trims/deduplicates IDs and reason; only changed students get history', async () => {
  const f = fixture({ users: [{ mahasiswa: { id: 'm1', status: 'Aktif' } }, { mahasiswa: { id: 'm2', status: 'Cuti' } }] });
  assert.deepEqual(await invoke(f, 'bulkUpdateStatus', { ids: [' u1 ', 'u1', 'u2'], status: 'Cuti', statusReason: ' reason ' }), {
    status: 200, response: { message: '1 mahasiswa berhasil diperbarui', data: { ids: ['u1', 'u2'], changedCount: 1, status: 'Cuti' } }, error: undefined,
  });
  assert.deepEqual(f.writes.at(-1), ['history.create', { data: { mahasiswaId: 'm1', statusLama: 'Aktif', statusBaru: 'Cuti', alasan: 'reason' } }]);
  assert.deepEqual(f.events, ['begin', 'user.findMany', 'mahasiswa.update', 'history.create', 'commit']);
});
test('bulk status validates all inputs before transaction with existing BadRequest messages', async () => {
  for (const patch of [{ ids: [] }, { ids: Array(101).fill('u1') }, { ids: [4] }, { ids: [' '] }, { status: 'bad' }, { statusReason: '' }, { statusReason: 3 }, { statusReason: 'a'.repeat(1001) }]) {
    const f = fixture(); const result = await invoke(f, 'bulkUpdateStatus', { ids: ['u1'], status: 'Aktif', statusReason: 'reason', ...patch });
    assert.equal(result.error.name, 'BadRequest'); assert.deepEqual(f.events, []);
  }
  for (const status of ['Aktif', 'Cuti', 'Lulus', 'Nonaktif']) {
    const f = fixture(); const result = await invoke(f, 'bulkUpdateStatus', { ids: Array(100).fill('u1'), status, statusReason: 'a'.repeat(1000) });
    assert.equal(result.error, undefined); assert.equal(result.response.data.changedCount, status === 'Aktif' ? 0 : 1);
  }
});
test('bulk status missing targets and history/write/commit failures reject atomically', async () => {
  for (const options of [{ users: [] }, { users: [{ mahasiswa: null }] }, { fail: 'mahasiswa.update' }, { fail: 'history.create' }, { fail: 'commit' }]) {
    const f = fixture(options); const result = await invoke(f, 'bulkUpdateStatus', { ids: ['u1'], status: 'Cuti', statusReason: 'reason' });
    assert.ok(result.error); assert.equal(result.response, undefined); assert.equal(f.events.at(-1), 'rollback');
  }
});
test('create response failure after commit retains legacy best-effort avatar cleanup', async () => {
  const f = fixture({ cleanupFails: true }); const failure = new Error('response failed'); let forwarded;
  await f.Controller.createStudent({ body }, { status() { return this; }, json() { throw failure; } }, error => { forwarded = error; });
  assert.equal(forwarded, failure); assert.deepEqual(f.events.slice(-2), ['commit', 'cleanup:avatar']);
});
