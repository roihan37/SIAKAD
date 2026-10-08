const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const Role = { Mahasiswa: 'Mahasiswa' };
const StatusKRS = { DRAFT: 'DRAFT', DIAJUKAN: 'DIAJUKAN', DISETUJUI: 'DISETUJUI', DITOLAK: 'DITOLAK' };

class AppError extends Error {
  constructor(statusCode, code, message, options = {}) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = options.details;
  }
}

function loadService(prisma) {
  const filename = path.join(__dirname, '../src/services/student-services/student-krs.service.ts');
  const context = {
    exports: {},
    require(name) {
      if (name === '../../lib/prisma') return { prisma };
      if (name === '../../errors/app-error') return { AppError };
      if (name === '@prisma/client') return {
        Prisma: { TransactionIsolationLevel: { RepeatableRead: 'RepeatableRead', Serializable: 'Serializable' } },
        Role,
        StatusKRS,
      };
      throw new Error(`Unexpected dependency ${name}`);
    },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return context.exports;
}

function offering(id, { day = 'SENIN', start = '08:00', end = '09:40', credits = 3, courseId = id } = {}) {
  return {
    id,
    mataKuliah: { id: courseId, kode: `MK${courseId}`, nama: `Mata Kuliah ${courseId}`, sks: credits },
    kelas: { id, nama: `Kelas ${id}` },
    dosen: { id: `d${id}`, nidn: `NIDN${id}`, user: { name: `Dosen ${id}` } },
    jadwal: [{
      id,
      hari: day,
      hariUrutan: 1,
      jamMulai: start,
      jamSelesai: end,
      ruangan: { id, kode: `R${id}`, nama: `Ruang ${id}`, gedung: null },
    }],
  };
}

function baseTx(overrides = {}) {
  return {
    user: {
      findUnique: async () => ({
        role: 'Mahasiswa',
        mahasiswa: { id: 'm1', prodiId: 10, status: 'Aktif' },
      }),
    },
    tahunAkademik: {
      findFirst: async () => ({ id: 7, tahun: '2026/2027', semester: 'GANJIL', isActive: true }),
      findUnique: async () => null,
    },
    periodeKRS: {
      findFirst: async () => ({
        id: 4,
        tahunAkademikId: 7,
        mulai: new Date('2026-01-01T00:00:00Z'),
        selesai: new Date('2027-01-01T00:00:00Z'),
        isActive: true,
      }),
    },
    kRS: {
      findUnique: async () => null,
      create: async () => ({ id: 'k1', status: 'DRAFT' }),
      update: async () => ({ id: 'k1', status: 'DRAFT' }),
    },
    kRSDetail: {
      deleteMany: async () => ({ count: 0 }),
      createMany: async () => ({ count: 0 }),
      updateMany: async () => ({ count: 0 }),
    },
    kelasMataKuliah: { findMany: async () => [] },
    ...overrides,
  };
}

test('schedule conflicts use kelasMataKuliahId and allow adjacent classes', () => {
  const { findScheduleConflict } = loadService({});
  const conflict = findScheduleConflict([
    offering(1, { start: '08:00', end: '10:00' }),
    offering(2, { start: '09:00', end: '11:00' }),
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(conflict)), {
    firstKelasMataKuliahId: 1,
    secondKelasMataKuliahId: 2,
    hari: 'SENIN',
    jamMulai: '09:00',
    jamSelesai: '10:00',
  });
  assert.equal(findScheduleConflict([
    offering(1, { start: '08:00', end: '09:00' }),
    offering(2, { start: '09:00', end: '10:00' }),
  ]), null);
});

test('GET derives status, credits, permissions and selectable offering state', async () => {
  const chosen = offering(1);
  const conflicting = offering(2, { start: '08:30', end: '10:00', credits: 2 });
  const tx = baseTx({
    kRS: {
      findUnique: async () => ({
        id: 'k1',
        status: 'DRAFT',
        details: [{ id: 'kd1', status: 'MENUNGGU', kelasMataKuliahId: 1, kelasMataKuliah: chosen }],
      }),
    },
    kelasMataKuliah: { findMany: async () => [chosen, conflicting] },
  });
  const prisma = {
    $transaction: async (fn, options) => {
      assert.equal(options.isolationLevel, 'RepeatableRead');
      return fn(tx);
    },
  };
  const { StudentKrsService } = loadService(prisma);
  const result = await StudentKrsService.getStudentKrsPage('u1', undefined, new Date('2026-06-01T00:00:00Z'));

  assert.equal(result.krsStatus, 'DRAFT');
  assert.equal(result.selectedCredits, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(result.permissions)), { canEdit: true, canSaveDraft: true, canSubmit: true });
  assert.equal(result.availableCourses[0].kelasMataKuliahId, 1);
  assert.equal(result.availableCourses[0].selected, true);
  assert.equal(result.availableCourses[1].canSelect, false);
  assert.equal(result.availableCourses[1].unavailableReason, 'SCHEDULE_CONFLICT');
  assert.equal(result.selectedKrsCourses[0].krsDetailId, 'kd1');
  assert.equal(Object.hasOwn(result, 'maxCredits'), false);
  assert.equal(Object.hasOwn(result, 'remainingCredits'), false);
});

test('PUT draft validates offerings and replaces details in a serializable transaction', async () => {
  const writes = [];
  const tx = baseTx({
    kelasMataKuliah: { findMany: async () => [offering(11), offering(12, { day: 'SELASA' })] },
    kRS: {
      findUnique: async () => null,
      create: async ({ data }) => { writes.push(['create-krs', data]); return { id: 'k1' }; },
    },
    kRSDetail: {
      deleteMany: async (args) => { writes.push(['delete-details', args]); },
      createMany: async (args) => { writes.push(['create-details', args]); },
    },
  });
  const prisma = {
    $transaction: async (fn, options) => {
      assert.equal(options.isolationLevel, 'Serializable');
      return fn(tx);
    },
  };
  const { StudentKrsService } = loadService(prisma);
  StudentKrsService.getStudentKrsPage = async () => ({ saved: true });
  assert.deepEqual(await StudentKrsService.saveDraft('u1', [11, 12]), { saved: true });
  assert.deepEqual(writes.map(([name]) => name), ['create-krs', 'delete-details', 'create-details']);
  assert.deepEqual(writes[2][1].data.map((item) => item.kelasMataKuliahId), [11, 12]);
});

test('PUT draft rejects duplicate IDs without writing', async () => {
  let writes = 0;
  const tx = baseTx({
    kRS: {
      findUnique: async () => null,
      create: async () => { writes += 1; },
    },
  });
  const prisma = { $transaction: async (fn) => fn(tx) };
  const { StudentKrsService } = loadService(prisma);
  await assert.rejects(() => StudentKrsService.saveDraft('u1', [11, 11]), (error) => error.code === 'DUPLICATE_KRS_OFFERING');
  assert.equal(writes, 0);
});

test('PUT draft rejects selecting two classes for the same course', async () => {
  const tx = baseTx({
    kelasMataKuliah: {
      findMany: async () => [offering(11, { courseId: 5 }), offering(12, { courseId: 5, day: 'SELASA' })],
    },
  });
  const prisma = { $transaction: async (fn) => fn(tx) };
  const { StudentKrsService } = loadService(prisma);
  await assert.rejects(() => StudentKrsService.saveDraft('u1', [11, 12]), (error) => error.code === 'DUPLICATE_KRS_COURSE');
});

test('POST submit revalidates draft and changes parent/detail statuses', async () => {
  const writes = [];
  const selected = offering(11);
  const tx = baseTx({
    kRS: {
      findUnique: async () => ({ id: 'k1', status: 'DRAFT', details: [{ kelasMataKuliahId: 11 }] }),
      update: async (args) => { writes.push(['krs', args]); },
    },
    kRSDetail: {
      updateMany: async (args) => { writes.push(['details', args]); },
    },
    kelasMataKuliah: { findMany: async () => [selected] },
  });
  const prisma = { $transaction: async (fn, options) => {
    assert.equal(options.isolationLevel, 'Serializable');
    return fn(tx);
  } };
  const { StudentKrsService } = loadService(prisma);
  StudentKrsService.getStudentKrsPage = async () => ({ status: 'DIAJUKAN' });
  assert.deepEqual(await StudentKrsService.submit('u1'), { status: 'DIAJUKAN' });
  assert.equal(writes[0][0], 'details');
  assert.deepEqual(JSON.parse(JSON.stringify(writes[0][1].data)), { status: 'MENUNGGU', approvedBy: null, approvedAt: null });
  assert.equal(writes[1][1].data.status, 'DIAJUKAN');
});

test('POST submit requires a saved DRAFT after a KRS was rejected', async () => {
  const tx = baseTx({
    kRS: {
      findUnique: async () => ({ id: 'k1', status: 'DITOLAK', details: [{ kelasMataKuliahId: 11 }] }),
    },
  });
  const prisma = { $transaction: async (fn) => fn(tx) };
  const { StudentKrsService } = loadService(prisma);
  await assert.rejects(() => StudentKrsService.submit('u1'), (error) => error.code === 'KRS_DRAFT_REQUIRED');
});

test('draft request validator accepts exact integer arrays and rejects malformed bodies', () => {
  const filename = path.join(__dirname, '../src/validation/academic-data.ts');
  const masterData = require('../dist/validation/master-data');
  const context = {
    exports: {},
    require(name) {
      if (name === './master-data') return masterData;
      if (name === '@prisma/client') return { Hari: {} };
      throw new Error(`Unexpected dependency ${name}`);
    },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  const validate = context.exports.studentKrsDraft;
  assert.deepEqual(JSON.parse(JSON.stringify(validate({ kelasMataKuliahIds: [1, '2'] }))), { kelasMataKuliahIds: [1, 2] });
  for (const body of [null, [], {}, { kelasMataKuliahIds: '1' }, { kelasMataKuliahIds: [0] }, { kelasMataKuliahIds: [], extra: true }]) {
    assert.throws(() => validate(body));
  }
});
