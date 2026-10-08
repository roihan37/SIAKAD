// Characterization written and run against the original controller before M7 extraction.
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
const oldKey = 'students/u1/old', newKey = 'students/u1/new';
function fixture(options = {}) {
  const events = [], calls = {};
  const failure = { code: 'test_failure' };
  const user = { id: 'u1', name: 'Old', email: 'old@example.test', username: 'old', avatarKey: oldKey,
    mahasiswa: { id: 'm1', nim: '123', angkatan: 2024, semester: 1, status: options.oldStatus ?? 'Aktif', prodiId: 1, dosenId: 'd1' } };
  function record(name, args) {
    events.push(name); calls[name] = plain(args);
    if (options.fail === name) throw failure;
  }
  const tx = {
    user: { async update(args) {
      record('update', args);
      // No new application enum validator: model the rejection at Prisma's boundary.
      if (options.rejectStatus) throw failure;
      const { mahasiswa, ...fields } = args.data;
      return { ...user, ...fields, mahasiswa: { ...user.mahasiswa, ...mahasiswa.update } };
    } },
    riwayatStatusMahasiswa: { async create(args) {
      record('history', args);
      const { mahasiswaId, ...data } = args.data;
      assert.equal(mahasiswaId, 'm1');
      return { id: 'h1', ...data, tanggal: new Date('2026-10-05T00:00:00Z') };
    } },
  };
  const prisma = {
    user: { async findUnique(args) { record('lookup', args); return options.missing ? null : options.noStudent ? { ...user, mahasiswa: null } : user; } },
    prodi: { async findUnique(args) { record('prodi', args); return options.noProdi ? null : { id: args.where.id }; } },
    dosen: { async findUnique(args) { record('dosen', args); return options.noDosen ? null : { id: args.where.id }; } },
    async $transaction(fn, config) {
      assert.equal(config, undefined); events.push('begin');
      try { const result = await fn(tx); record('commit', {}); return result; }
      catch (error) { events.push('rollback'); throw error; }
    },
  };
  const S3Service = {
    async checkObjectExists(key) { record('verify', key); return !options.noObject; },
    async deleteUrl(key) { record(`delete:${key}`, key); if (options.cleanupFails) throw failure; },
    async createReadUrl(key) { record('sign', key); return `signed:${key}`; },
  };
  const hashPassword = async value => { record('hash', value); return `hashed:${value}`; };
  const { StudentManagementService: service } = load('services/student-services/student-management.service.ts', {
    '@prisma/client': {}, '../../lib/prisma': { prisma }, '../../lib/bycript': { hashPassword },
    '../avatar.service': {}, '../s3.service': { S3Service },
  });
  const { Controller } = load('controllers/studentController.ts', {
    ...Object.fromEntries(['../validation/master-data', '../services/student-services/student-finance.service',
      '../services/student-services/student-account.service', '../services/student-services/student-attendance.service',
      '../services/student-services/student-academic.service', '../services/student-services/student-profile.service',
      '../validation/student-profile', '../auth/validation', '../auth/auth.service', '../auth/session-cookie',
      '../lib/responseHelpers'].map(name => [name, {}])),
    '../services/student-services/student-management.service': { StudentManagementService: service },
  });
  return { Controller, service, events, calls, failure, user };
}
async function invoke(f, body = {}, id = 'u1', responseFails = false) {
  let status, response, error;
  await f.Controller.updateStudentById({ params: { id }, body }, {
    status(value) { status = value; return this; },
    json(value) { if (responseFails) throw f.failure; response = plain(value); },
  }, value => { error = value; });
  return { status, response, error };
}
test('update basic fields, exact envelope, selects and untrimmed values; unknown/immutable fields ignored', async () => {
  const f = fixture();
  const fields = { name: ' New ', email: ' NEW@EXAMPLE.TEST ', username: ' login ', phoneNumber: '123',
    gender: 'Female', address: 'Address', nik: 'nik', birthPlace: 'Place' };
  const result = await invoke(f, { ...fields, nim: ' NIM ', id: 'other', role: 'Admin', avatarUrl: 'ignored', mustChangePassword: true }, ' u1 ');
  assert.equal(result.error, undefined); assert.equal(result.status, 200);
  assert.deepEqual(f.calls.lookup.where, { id: ' u1 ' });
  assert.deepEqual(f.calls.update.where, { id: ' u1 ' });
  assert.deepEqual(f.calls.update.data, { ...fields, mahasiswa: { update: { nim: ' NIM ' } } });
  assert.deepEqual(result.response, { message: 'Mahasiswa berhasil diperbarui', data: {
    id: 'u1', nama: fields.name, email: fields.email, username: fields.username, avatarUrl: `signed:${oldKey}`,
    mahasiswa: { ...f.user.mahasiswa, nim: ' NIM ' }, statusHistory: null,
  } });
  assert.deepEqual(f.calls.update.select, { id: true, name: true, email: true, username: true, avatarKey: true,
    mahasiswa: { select: { id: true, nim: true, angkatan: true, semester: true, status: true, prodiId: true, dosenId: true } } });
  assert.deepEqual(f.events, ['lookup', 'begin', 'update', 'commit', 'sign']);
});
for (const [options, name, message] of [
  [{ missing: true }, 'NotFound', 'User tidak ditemukan'],
  [{ noStudent: true }, 'BadRequest', 'User ini bukan mahasiswa'],
]) test(`update lookup ${message}`, async () => {
  const f = fixture(options); assert.deepEqual(plain((await invoke(f)).error), { name, message });
  assert.deepEqual(f.events, ['lookup']);
});
test('update status requires reason on every transition; unchanged/omitted ignores reason', async () => {
  for (const statusReason of [undefined, null, '', '  ']) {
    const f = fixture({ oldStatus: 'Cuti' }); const result = await invoke(f, { status: 'Aktif', statusReason });
    assert.equal(result.error.message, 'Alasan perubahan status wajib diisi'); assert.deepEqual(f.events, ['lookup']);
  }
  for (const body of [{ status: 'Aktif', statusReason: null }, { statusReason: 'ignored' }, {}]) {
    const f = fixture(); assert.equal((await invoke(f, body)).response.data.statusHistory, null);
    assert.ok(!f.events.includes('history'));
  }
});
test('update valid transitions write history within transaction with trimmed/stringified unbounded reason', async () => {
  for (const [status, statusReason, reason] of [['Cuti', ' reason ', 'reason'], ['Lulus', 123, '123'], ['Nonaktif', 'a'.repeat(1001), 'a'.repeat(1001)]]) {
    const f = fixture(); const result = await invoke(f, { status, statusReason });
    assert.deepEqual(f.calls.history, { data: { mahasiswaId: 'm1', statusLama: 'Aktif', statusBaru: status, alasan: reason },
      select: { id: true, statusLama: true, statusBaru: true, alasan: true, tanggal: true } });
    assert.equal(result.response.data.statusHistory.statusBaru, status);
    assert.deepEqual(f.events, ['lookup', 'begin', 'update', 'history', 'commit', 'sign']);
  }
});
test('invalid/null/empty status with reason reaches Prisma unchanged and propagates its error', async () => {
  for (const status of ['INVALID', null, '']) {
    const f = fixture({ rejectStatus: true }); const result = await invoke(f, { status, statusReason: 'reason' });
    assert.equal(result.error, f.failure); assert.equal(f.calls.update.data.mahasiswa.update.status, status);
    assert.deepEqual(f.events, ['lookup', 'begin', 'update', 'rollback']);
  }
  const f = fixture(); assert.equal((await invoke(f, { status: 'INVALID' })).error.message, 'Alasan perubahan status wajib diisi');
});
for (const [birthDate, message] of [
  ['2000-1-01', 'birthDate harus menggunakan format YYYY-MM-DD'],
  [' 2000-01-01', 'birthDate harus menggunakan format YYYY-MM-DD'],
  ['2023-02-29', 'birthDate tidak valid'], ['2000-13-01', 'birthDate tidak valid'], ['0099-01-01', 'birthDate tidak valid'],
]) test(`invalid birthDate ${birthDate}`, async () => {
  const f = fixture(); assert.equal((await invoke(f, { birthDate })).error.message, message); assert.deepEqual(f.events, ['lookup']);
});
test('valid birthDate uses UTC midnight; null/empty clears; omission does not write', async () => {
  for (const [birthDate, expected] of [['2000-02-29', '2000-02-29T00:00:00.000Z'], [null, null], ['', null]]) {
    const f = fixture(); assert.equal((await invoke(f, { birthDate })).error, undefined); assert.equal(f.calls.update.data.birthDate, expected);
  }
  const f = fixture(); await invoke(f); assert.ok(!('birthDate' in f.calls.update.data));
});
for (const field of ['angkatan', 'semester', 'prodiId']) test(`${field} retains positive-integer coercion and omission semantics`, async () => {
  for (const value of [null, '', 0, -1, 1.5, 'bad']) {
    const f = fixture(); assert.equal((await invoke(f, { [field]: value })).error.message, `${field} harus berupa angka positif`);
    assert.deepEqual(f.events, ['lookup']);
  }
  for (const [value, expected] of [[' 2 ', 2], [true, 1], [99999, 99999]]) {
    const f = fixture(); assert.equal((await invoke(f, { [field]: value })).error, undefined);
    assert.equal(f.calls.update.data.mahasiswa.update[field], expected);
  }
});
test('relation existence errors precede transaction/avatar; valid relations read outside transaction', async () => {
  for (const [options, body, message] of [[{ noProdi: true }, { prodiId: 2 }, 'Program Studi tidak ditemukan'],
    [{ noDosen: true }, { dosenId: 'd2' }, 'Dosen tidak ditemukan']]) {
    const f = fixture(options); const result = await invoke(f, { ...body, avatarKey: newKey });
    assert.equal(result.error.name, 'NotFound'); assert.equal(result.error.message, message); assert.ok(!f.events.includes('begin')); assert.ok(!f.events.includes('verify'));
  }
  const f = fixture(); await invoke(f, { prodiId: '2', dosenId: ' d2 ' });
  assert.deepEqual(f.calls.dosen.where, { id: ' d2 ' });
  assert.deepEqual(f.calls.update.data.mahasiswa.update, { prodiId: 2, dosenId: ' d2 ' });
  assert.deepEqual(f.events, ['lookup', 'prodi', 'dosen', 'begin', 'update', 'commit', 'sign']);
  for (const dosenId of [null, '']) {
    const f = fixture(); await invoke(f, { dosenId }); assert.equal(f.calls.update.data.mahasiswa.update.dosenId, null); assert.ok(!f.events.includes('dosen'));
  }
});
test('optional fields preserve undefined/null/empty; required raw fields are delegated to Prisma', async () => {
  for (const value of [null, '']) {
    const f = fixture(); const fields = Object.fromEntries(['name', 'email', 'username', 'phoneNumber', 'gender', 'address', 'nik', 'birthPlace'].map(key => [key, value]));
    await invoke(f, { ...fields, nim: value });
    assert.deepEqual(f.calls.update.data, { ...fields, mahasiswa: { update: { nim: value } } });
  }
  const f = fixture(); await invoke(f, { name: undefined, dosenId: undefined, avatarKey: undefined });
  assert.deepEqual(f.calls.update.data, { mahasiswa: { update: {} } });
});
test('password hashes before transaction and revokes tokens in same nested update', async () => {
  const f = fixture(); await invoke(f, { password: 'short' });
  assert.deepEqual(f.calls.update.data, { password: 'hashed:short', refreshTokens: { updateMany: { where: {}, data: { revoked: true } } }, mahasiswa: { update: {} } });
  assert.deepEqual(f.events, ['lookup', 'hash', 'begin', 'update', 'commit', 'sign']);
  for (const password of [undefined, null, '']) { const f = fixture(); await invoke(f, { password }); assert.ok(!f.events.includes('hash')); }
});
test('same avatar reverified, clears stored URL, never deletes; omitted avatar only signs', async () => {
  const f = fixture(); await invoke(f, { avatarKey: oldKey });
  assert.deepEqual(f.calls.update.data, { avatarKey: oldKey, avatarUrl: null, mahasiswa: { update: {} } });
  assert.deepEqual(f.events, ['lookup', 'verify', 'begin', 'update', 'commit', 'sign']);
  const failed = fixture({ fail: 'update' }); await invoke(failed, { avatarKey: oldKey });
  assert.deepEqual(failed.events, ['lookup', 'verify', 'begin', 'update', 'rollback']);
});
test('replacement verifies before hashing, deletes old only after commit, then signs new', async () => {
  const f = fixture(); const result = await invoke(f, { avatarKey: newKey, password: 'secret' });
  assert.equal(result.response.data.avatarUrl, `signed:${newKey}`);
  assert.deepEqual(f.events, ['lookup', 'verify', 'hash', 'begin', 'update', 'commit', `delete:${oldKey}`, 'sign']);
});
test('removal null/empty commits before deleting old; no verify/sign; rollback retains old', async () => {
  for (const avatarKey of [null, '']) {
    const f = fixture(); assert.equal((await invoke(f, { avatarKey })).response.data.avatarUrl, null);
    assert.equal(f.calls.update.data.avatarKey, null); assert.equal(f.calls.update.data.avatarUrl, null);
    assert.deepEqual(f.events, ['lookup', 'begin', 'update', 'commit', `delete:${oldKey}`]);
    const failed = fixture({ fail: 'commit' }); await invoke(failed, { avatarKey });
    assert.ok(!failed.events.some(e => e.startsWith('delete:')));
  }
});
test('avatar prefix, missing object and verification errors do not register cleanup', async () => {
  for (const [options, avatarKey, message] of [[{}, 'students/other/new', 'Avatar tidak valid'],
    [{ noObject: true }, newKey, 'File avatar tidak ditemukan'], [{ fail: 'verify' }, newKey, undefined]]) {
    const f = fixture(options); const result = await invoke(f, { avatarKey });
    if (message) assert.equal(result.error.message, message); else assert.equal(result.error, f.failure);
    assert.ok(!f.events.includes('begin')); assert.ok(!f.events.some(e => e.startsWith('delete:')));
  }
});
for (const fail of ['hash', 'update', 'history', 'commit']) test(`${fail} failure compensates verified new avatar only, preserving error even if cleanup fails`, async () => {
  for (const cleanupFails of [false, true]) {
    const f = fixture({ fail, cleanupFails }); const result = await invoke(f, { avatarKey: newKey, password: 'short', status: 'Cuti', statusReason: 'reason' });
    assert.equal(result.error, f.failure); assert.equal(result.response, undefined);
    assert.equal(f.events.at(-1), `delete:${newKey}`); assert.ok(!f.events.includes(`delete:${oldKey}`));
    if (fail !== 'hash') assert.equal(f.events.at(-2), 'rollback');
  }
});
test('post-commit old cleanup failure succeeds; signing/response errors never compensate committed avatar', async () => {
  const f = fixture({ cleanupFails: true }); assert.equal((await invoke(f, { avatarKey: newKey })).status, 200); assert.equal(f.events.at(-1), 'sign');
  for (const responseFails of [false, true]) {
    const f = fixture(responseFails ? {} : { fail: 'sign' }); const result = await invoke(f, { avatarKey: newKey }, 'u1', responseFails);
    assert.equal(result.error, f.failure); assert.ok(f.events.includes('commit'));
    assert.deepEqual(f.events.slice(-2), [`delete:${oldKey}`, 'sign']); assert.ok(!f.events.includes(`delete:${newKey}`));
  }
});
test('service update can run without HTTP and handles a first avatar without old-key deletion', async () => {
  const f = fixture(); f.user.avatarKey = null;
  const data = await f.service.updateStudent({ userId: 'u1', avatarKey: newKey });
  assert.equal(data.avatarUrl, `signed:${newKey}`);
  assert.deepEqual(f.events, ['lookup', 'verify', 'begin', 'update', 'commit', 'sign']);
});
test('controller passes an explicit field allow-list, retains null/empty values and forwards service errors', async () => {
  const f = fixture(); const data = { marker: 'service result' }; let input;
  f.service.updateStudent = async value => { input = value; return data; };
  const result = await invoke(f, { name: '', birthDate: null, role: 'Admin', unexpected: true }, 123);
  assert.equal(input.userId, '123'); assert.equal(input.name, ''); assert.equal(input.birthDate, null);
  assert.equal(input.email, undefined); assert.ok(!('role' in input)); assert.ok(!('unexpected' in input));
  assert.deepEqual(result.response, { message: 'Mahasiswa berhasil diperbarui', data });
  assert.deepEqual(f.events, []);
  f.service.updateStudent = async () => { throw f.failure; };
  assert.equal((await invoke(f)).error, f.failure);
});
