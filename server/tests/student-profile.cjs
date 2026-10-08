const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const plain = value => JSON.parse(JSON.stringify(value));

function load(file, imports) {
  const context = { exports: {}, console, require(name) {
    if (!(name in imports)) throw new Error(`Unexpected dependency ${name}`);
    return imports[name];
  } };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return context.exports;
}

function profileFixture() {
  const calls = [];
  const profile = {
    name: 'Student Name', email: 'student@example.test', username: 'student', role: 'Mahasiswa',
    phoneNumber: '0812', nik: '1234567890', address: 'Address', birthDate: new Date('2001-02-03T00:00:00Z'),
    birthPlace: 'Bandung', gender: 'Female', avatarKey: 'students/user-1/avatar.png',
    mahasiswa: {
      nim: '220001', angkatan: 2022, semester: 8, status: 'Aktif',
      prodi: {
        id: 2, kode: 'IF', name: 'Informatika',
        fakultas: { id: 3, kode: 'FT', name: 'Teknik' },
        kurikulum: [{ id: 4, kode: 'K22', nama: 'Kurikulum 2022', tahun: 2022 }],
      },
      dosen: { id: 'lecturer-1', nidn: '0101', user: { name: 'Advisor Name' } },
    },
  };
  let lookup = 0;
  const prisma = { user: {
    async findUnique(args) {
      calls.push(['findUnique', plain(args)]);
      lookup++;
      return lookup === 1 && args.select?.mahasiswa?.select?.id ? { mahasiswa: { id: 'student-1' } } : profile;
    },
    async update(args) { calls.push(['update', plain(args)]); return {}; },
  } };
  const S3Service = { async createReadUrl(key) { calls.push(['sign', key]); return `signed:${key}`; } };
  const { StudentProfileService } = load('services/student-services/student-profile.service.ts', {
    '@prisma/client': { Role: { Mahasiswa: 'Mahasiswa' } },
    '../../lib/prisma': { prisma }, '../s3.service': { S3Service },
  });
  return { StudentProfileService, calls, profile };
}

test('student profile aggregates supported fields without selecting credentials', async () => {
  const f = profileFixture();
  const result = plain(await f.StudentProfileService.getProfile('user-1'));
  assert.deepEqual(f.calls[0][1].where, { id: 'user-1', role: 'Mahasiswa' });
  assert.equal(JSON.stringify(f.calls[0][1].select).includes('password'), false);
  assert.deepEqual(result.header, {
    avatarUrl: 'signed:students/user-1/avatar.png', name: 'Student Name', nim: '220001',
    studyProgram: { id: 2, code: 'IF', name: 'Informatika' },
    faculty: { id: 3, code: 'FT', name: 'Teknik' }, status: 'Aktif',
  });
  assert.deepEqual(result.personal, {
    name: 'Student Name', nik: '1234567890', gender: 'Female', birthPlace: 'Bandung',
    birthDate: '2001-02-03T00:00:00.000Z', email: 'student@example.test', phoneNumber: '0812', address: 'Address',
  });
  assert.deepEqual(result.academic, {
    nim: '220001', faculty: { id: 3, code: 'FT', name: 'Teknik' },
    studyProgram: { id: 2, code: 'IF', name: 'Informatika' }, cohort: 2022, semester: 8, status: 'Aktif',
    academicAdvisor: { id: 'lecturer-1', nidn: '0101', name: 'Advisor Name' },
    curriculum: { id: 4, code: 'K22', name: 'Kurikulum 2022', year: 2022 },
  });
  assert.deepEqual(result.account, { username: 'student', loginEmail: 'student@example.test', role: 'Mahasiswa' });
});

test('student profile update writes only the service whitelist and reloads aggregate', async () => {
  const f = profileFixture();
  await f.StudentProfileService.updateProfile('user-1', {
    email: 'new@example.test', phoneNumber: null, name: 'Ignored', nik: 'Ignored', semester: 99,
  });
  const update = f.calls.find(([name]) => name === 'update')[1];
  assert.deepEqual(update, { where: { id: 'user-1' }, data: { email: 'new@example.test', phoneNumber: null } });
});

test('student profile validation accepts editable fields and rejects official or unknown fields', () => {
  const { studentProfilePatch, studentAvatarPatch } = require('../src/validation/student-profile');
  const parsed = studentProfilePatch({
    email: ' student@example.test ', phoneNumber: '', address: null, birthPlace: ' Bandung ',
    birthDate: '2000-02-29', gender: 'Female',
  });
  assert.equal(parsed.email, 'student@example.test');
  assert.equal(parsed.phoneNumber, null);
  assert.equal(parsed.birthPlace, 'Bandung');
  assert.equal(parsed.birthDate.toISOString(), '2000-02-29T00:00:00.000Z');
  for (const field of ['name', 'nik', 'nim', 'faculty', 'studyProgram', 'cohort', 'semester', 'status',
    'academicAdvisor', 'curriculum', 'role', 'username', 'accountStatus', 'lastLogin', 'studentId']) {
    assert.throws(() => studentProfilePatch({ [field]: 'changed' }), error => error.name === 'BadRequest');
  }
  assert.deepEqual(studentAvatarPatch({ avatarKey: ' students/user-1/avatar.png ' }), { avatarKey: 'students/user-1/avatar.png' });
  assert.throws(() => studentAvatarPatch({ avatarKey: 'key', userId: 'other' }), error => error.name === 'BadRequest');
});

function passwordFixture(options = {}) {
  const calls = [];
  const prisma = {
    user: { async findUnique(args) { calls.push(['lookup', plain(args)]); return options.missing ? null : { password: 'stored-hash' }; } },
    async $transaction(fn, config) {
      calls.push(['transaction', plain(config)]);
      return fn({
        user: { async updateMany(args) { calls.push(['password', plain(args)]); return { count: options.conflict ? 0 : 1 }; } },
        refreshToken: { async updateMany(args) { calls.push(['sessions', plain(args)]); return { count: 2 }; } },
      });
    },
  };
  const password = {
    async comparePassword(value, hash) { calls.push(['compare', value, hash]); return !options.wrongPassword; },
    async hashPassword(value) { calls.push(['hash', value]); return 'new-hash'; },
    hashCrypto() { return 'unused'; },
  };
  const { changeUserPassword } = load('auth/auth.service.ts', {
    '@prisma/client': { Prisma: { TransactionIsolationLevel: { Serializable: 'Serializable' } } },
    crypto: { randomUUID() { return 'unused'; } }, '../lib/prisma': { prisma }, '../lib/bycript': password,
    '../lib/sendToken': {}, './config': { sessionLifetimeMs: 1 },
  });
  return { changeUserPassword, calls };
}

test('password change verifies current password, hashes, compare-and-swaps, and revokes sessions', async () => {
  const f = passwordFixture();
  await f.changeUserPassword('user-1', 'current-password', 'new-password');
  assert.deepEqual(f.calls, [
    ['lookup', { where: { id: 'user-1' }, select: { password: true } }],
    ['compare', 'current-password', 'stored-hash'], ['hash', 'new-password'],
    ['transaction', { isolationLevel: 'Serializable' }],
    ['password', { where: { id: 'user-1', password: 'stored-hash' }, data: { password: 'new-hash', mustChangePassword: false } }],
    ['sessions', { where: { userId: 'user-1' }, data: { revoked: true } }],
  ]);
  await assert.rejects(() => passwordFixture({ wrongPassword: true }).changeUserPassword('user-1', 'wrong', 'new-password'),
    error => error.name === 'Unauthorized');
  await assert.rejects(() => passwordFixture({ conflict: true }).changeUserPassword('user-1', 'current', 'new-password'),
    error => error.name === 'Conflict');
});
