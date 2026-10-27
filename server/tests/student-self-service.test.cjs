const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function loadTypeScriptModule(filename, dependencies) {
  const context = {
    exports: {},
    require(name) {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      throw new Error(`Unexpected dependency ${name}`);
    },
  };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, context);
  return context.exports;
}

function loadTuitionService() {
  return loadTypeScriptModule(path.join(__dirname, '../src/services/tuition.service.ts'), {
    '@prisma/client': { Prisma: {} },
    '../validation/tuition': { billListQuery: () => ({}) },
  });
}

function loadAcademicService(prisma) {
  return loadTypeScriptModule(path.join(__dirname, '../src/services/student-services/student-academic.service.ts'), {
    '../../lib/prisma': { prisma },
    '@prisma/client': {
      Prisma: { TransactionIsolationLevel: { RepeatableRead: 'RepeatableRead' } },
      Semester: { GANJIL: 'GANJIL', GENAP: 'GENAP' },
    },
  });
}

function loadDashboardService(services) {
  return loadTypeScriptModule(path.join(__dirname, '../src/services/student-services/student-dashboard.service.ts'), {
    './student-academic.service': { StudentAcademicService: services.academic },
    './student-attendance.service': { StudentAttendanceService: services.attendance },
    './student-finance.service': { StudentFinanceService: services.finance },
    './student-profile.service': { StudentProfileService: services.profile },
    './student-schedule.service': { StudentScheduleService: services.schedule },
  });
}

function transcriptDetail(id, course, grade) {
  return {
    id,
    kelasMataKuliah: { mataKuliah: course },
    transkrip: [{ nilaiAngka: grade.nilai, nilaiHuruf: grade.huruf, bobot: grade.bobot }],
  };
}

test('student payments are owned by the authenticated user and totals only successful payments', async () => {
  let paymentQuery;
  const tx = {
    mahasiswa: {
      findUnique: async (args) => {
        assert.deepEqual(JSON.parse(JSON.stringify(args.where)), { userId: 'user-1' });
        return { id: 'student-1' };
      },
    },
    pembayaranUKT: {
      findMany: async (args) => {
        paymentQuery = args;
        return [
          {
            id: 'payment-1', nomorPembayaran: 'PAY-1', nominal: 1500000,
            metode: 'TRANSFER_BANK', status: 'SUCCESS', sumber: 'MANUAL', reference: 'REF-1',
            paidAt: new Date('2026-08-10T03:00:00.000Z'), createdAt: new Date('2026-08-10T02:00:00.000Z'),
            tagihan: {
              id: 'bill-1', nomorTagihan: 'BILL-1', nominal: 3000000,
              jatuhTempo: new Date('2026-08-31T00:00:00.000Z'), status: 'SEBAGIAN',
              tahunAkademik: { id: 7, tahun: '2026/2027', semester: 'GANJIL' },
            },
          },
          {
            id: 'payment-2', nomorPembayaran: 'PAY-2', nominal: 1500000,
            metode: 'VIRTUAL_ACCOUNT', status: 'PENDING', sumber: 'GATEWAY', reference: null,
            paidAt: null, createdAt: new Date('2026-08-11T02:00:00.000Z'),
            tagihan: {
              id: 'bill-1', nomorTagihan: 'BILL-1', nominal: 3000000,
              jatuhTempo: new Date('2026-08-31T00:00:00.000Z'), status: 'SEBAGIAN',
              tahunAkademik: { id: 7, tahun: '2026/2027', semester: 'GANJIL' },
            },
          },
        ];
      },
    },
  };

  const { listStudentPayments } = loadTuitionService();
  const result = await listStudentPayments(tx, 'user-1');

  assert.deepEqual(JSON.parse(JSON.stringify(paymentQuery.where)), { tagihan: { mahasiswaId: 'student-1' } });
  assert.deepEqual(JSON.parse(JSON.stringify(result.summary)), {
    totalPayments: 2,
    successful: 1,
    pending: 1,
    totalPaid: 1500000,
  });
  assert.equal(result.payments[0].status, 'SUCCESS');
  assert.equal(result.payments[0].bill.academicYear.id, 7);
});

test('student transcript keeps semester history but uses the latest course attempt cumulatively', async () => {
  const calculus = { id: 10, kode: 'MK10', nama: 'Kalkulus', sks: 3 };
  const physics = { id: 20, kode: 'MK20', nama: 'Fisika', sks: 2 };
  const tx = {
    user: { findUnique: async () => ({ mahasiswa: { id: 'student-1', angkatan: 2025 } }) },
    kRS: {
      findMany: async () => [
        {
          tahunAkademik: { id: 1, tahun: '2025/2026', semester: 'GANJIL' },
          details: [transcriptDetail('detail-1', calculus, { nilai: 60, huruf: 'C', bobot: 2 })],
        },
        {
          tahunAkademik: { id: 2, tahun: '2025/2026', semester: 'GENAP' },
          details: [
            transcriptDetail('detail-2', calculus, { nilai: 90, huruf: 'A', bobot: 4 }),
            transcriptDetail('detail-3', physics, { nilai: 75, huruf: 'B', bobot: 3 }),
          ],
        },
      ],
    },
  };
  const prisma = {
    $transaction: async (operation, options) => {
      assert.equal(options.isolationLevel, 'RepeatableRead');
      return operation(tx);
    },
  };

  const { StudentAcademicService } = loadAcademicService(prisma);
  const result = await StudentAcademicService.getMyTranscript('user-1');

  assert.equal(result.semesters.length, 2);
  assert.equal(result.semesters[0].semesterNumber, 2);
  assert.equal(result.semesters[1].semesterGpa, 2);
  assert.equal(result.completedCredits, 5);
  assert.equal(result.cumulativeGpa, 3.6);
});

test('student grades include prior terms only through the selected academic term', async () => {
  let gradeQuery;
  const tx = {
    user: { findUnique: async () => ({ mahasiswa: { id: 'student-1' } }) },
    tahunAkademik: {
      findUnique: async () => ({ id: 7, tahun: '2026/2027', semester: 'GENAP' }),
    },
    kRS: {
      findMany: async (args) => {
        gradeQuery = args;
        return [{
          tahunAkademikId: 7,
          tahunAkademik: { tahun: '2026/2027', semester: 'GENAP' },
          details: [transcriptDetail('detail-1', { id: 10, kode: 'MK10', nama: 'Kalkulus', sks: 3 }, { nilai: 90, huruf: 'A', bobot: 4 })],
        }];
      },
      findUnique: async () => null,
    },
  };
  const prisma = { $transaction: async (operation) => operation(tx) };

  const { StudentAcademicService } = loadAcademicService(prisma);
  const result = await StudentAcademicService.getStudentNilai('user-1', 7);

  assert.deepEqual(JSON.parse(JSON.stringify(gradeQuery.where.tahunAkademik.OR)), [
    { tahun: { lt: '2026/2027' } },
    { tahun: '2026/2027', semester: { in: ['GANJIL', 'GENAP'] } },
  ]);
  assert.equal(result.nilai.tahunAkademik.id, 7);
  assert.equal(result.nilai.summary.ips, 4);
  assert.equal(result.nilai.summary.ipk, 4);
});

test('student dashboard aggregates owned services and derives the KRS year on the backend', async () => {
  const calls = [];
  const services = {
    profile: { getProfile: async (userId) => {
      calls.push(['profile', userId]);
      return {
        header: { name: 'Mahasiswa', studyProgram: { id: 1, code: 'IF', name: 'Informatika' } },
        academic: { semester: 3, status: 'AKTIF' },
      };
    } },
    schedule: { getMySchedule: async (userId) => {
      calls.push(['schedule', userId]);
      return { academicYear: { id: 7, year: '2026/2027', semester: 'GANJIL', isActive: true }, schedules: [] };
    } },
    attendance: { getMyAttendance: async (userId) => {
      calls.push(['attendance', userId]);
      return { summary: { attendancePercentage: 92 }, courses: [] };
    } },
    finance: { getMyUKT: async (userId) => {
      calls.push(['tuition', userId]);
      return { bills: [{ id: 'bill-1' }] };
    } },
    academic: {
      getMyTranscript: async (userId) => {
        calls.push(['transcript', userId]);
        return { cumulativeGpa: 3.75, completedCredits: 48 };
      },
      getStudentKRS: async (userId, academicYearId) => {
        calls.push(['krs', userId, academicYearId]);
        return { krs: { status: 'DIAJUKAN', totalSKS: 21 } };
      },
    },
  };

  const { StudentDashboardService } = loadDashboardService(services);
  const result = await StudentDashboardService.getMyDashboard('user-1');

  assert.deepEqual(calls.map((call) => call[1]), Array(6).fill('user-1'));
  assert.deepEqual(calls.find((call) => call[0] === 'krs'), ['krs', 'user-1', 7]);
  assert.deepEqual(JSON.parse(JSON.stringify(result.summary)), {
    cumulativeGpa: 3.75,
    completedCredits: 48,
    attendancePercentage: 92,
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.krs)), { status: 'DIAJUKAN', selectedCredits: 21 });
  assert.deepEqual(JSON.parse(JSON.stringify(result.tuition)), { id: 'bill-1' });
});
