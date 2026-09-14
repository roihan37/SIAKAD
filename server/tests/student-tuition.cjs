const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../src/lib/prisma');
const { Controller } = require('../src/controllers/studentController');
const { listStudentTuitionBills } = require('../src/services/tuition.service');
const decimal = value => new Prisma.Decimal(value);

async function main() {
  const bill = { id: 'bill', nomorTagihan: 'UKT-2026-000001', nominal: decimal(5000000), jatuhTempo: new Date('2026-09-30T16:59:59.999Z'), tahunAkademik: { id: 3, tahun: '2026/2027', semester: 'GANJIL' } };
  let payments = [];
  let rows = true;
  const tx = {
    mahasiswa: { findUnique: async args => { assert.deepEqual(args.where, { userId: 'logged-in-user' }); return { id: 'student' }; } },
    tagihanUKT: { findMany: async args => {
      assert.deepEqual(args.where, { mahasiswaId: 'student' });
      assert.deepEqual(args.select.pembayaran.where, { status: 'SUCCESS' });
      return rows ? [{ ...bill, pembayaran: payments }] : [];
    } },
  };
  const now = new Date('2026-09-14T00:00:00Z');
  let result = await listStudentTuitionBills(tx, 'logged-in-user', now);
  assert.equal(result.bills[0].status, 'BELUM_DIBAYAR');
  assert.equal(result.bills[0].paidAt, null);
  payments = [{ nominal: decimal(2000000), paidAt: new Date('2026-09-13T02:30:00Z') }];
  result = await listStudentTuitionBills(tx, 'logged-in-user', now);
  assert.equal(result.bills[0].status, 'SEBAGIAN');
  assert.equal(result.bills[0].remainingAmount, 3000000);
  result = await listStudentTuitionBills(tx, 'logged-in-user', new Date('2026-10-01T00:00:00Z'));
  assert.equal(result.bills[0].status, 'JATUH_TEMPO');
  payments.unshift({ nominal: decimal(3000000), paidAt: new Date('2026-09-14T02:30:00Z') });
  result = await listStudentTuitionBills(tx, 'logged-in-user', now);
  assert.deepEqual(result.bills[0], {
    id: 'bill', academicYear: { id: 3, year: '2026/2027', semester: 'GANJIL' },
    billNumber: 'UKT-2026-000001', amount: 5000000, paidAmount: 5000000, remainingAmount: 0,
    dueDate: '2026-09-30', status: 'LUNAS', paidAt: '2026-09-14T02:30:00.000Z',
  });
  payments.push({ nominal: decimal(100), paidAt: null });
  assert.equal((await listStudentTuitionBills(tx, 'logged-in-user', now)).bills[0].remainingAmount, 0);
  rows = false;
  assert.deepEqual(await listStudentTuitionBills(tx, 'logged-in-user', now), { bills: [] });
  await assert.rejects(() => listStudentTuitionBills({ mahasiswa: { findUnique: async () => null } }, 'missing', now), error => error.name === 'NotFound');
  prisma.$transaction = async (fn, options) => { assert.equal(options.isolationLevel, 'RepeatableRead'); return fn(tx); };
  let response;
  await Controller.getMyUKT({ userLogin: { id: 'logged-in-user', role: 'Mahasiswa' }, query: { userId: 'another-user' }, params: { id: 'another-user' } }, {
    status(code) { assert.equal(code, 200); return this; }, json(value) { response = value; },
  }, error => { throw error; });
  assert.deepEqual(response, { message: 'Tuition bills retrieved successfully', data: { bills: [] } });
  // The admin endpoint selects the route's User.id, not the admin's own ID.
  await Controller.getUKTById({ userLogin: { id: 'admin', role: 'Admin' }, params: { id: 'logged-in-user' } }, {
    status(code) { assert.equal(code, 200); return this; }, json(value) { response = value; },
  }, error => { throw error; });
  assert.deepEqual(response, { message: 'Tuition bills retrieved successfully', data: { bills: [] } });
  let invalidId;
  await Controller.getUKTById({ params: { id: ' ' } }, {}, error => { invalidId = error; });
  assert.equal(invalidId.name, 'BadRequest');
  const router = require('../src/router/students').default;
  const { adminMiddleware } = require('../src/middleware/authMid');
  const route = router.stack.find(layer => layer.route?.path === '/:id/ukt').route;
  assert.equal(route.stack[0].handle, adminMiddleware);
  assert.equal(route.stack[1].handle, Controller.getUKTById);
  prisma.$transaction = async fn => fn({ mahasiswa: { findUnique: async () => null } });
  let missingStudent;
  await Controller.getUKTById({ params: { id: 'missing' } }, {}, error => { missingStudent = error; });
  assert.equal(missingStudent.name, 'NotFound');
  for (const [userLogin, expected] of [[undefined, 'TokenInvalid'], [{ role: 'Admin' }, 'Forbidden'], [{ role: 'Dosen' }, 'Forbidden']]) {
    let error;
    await Controller.getMyUKT({ userLogin }, {}, value => { error = value; });
    assert.equal(error.name, expected);
  }
  console.log('PASS: own-account isolation, access checks, balances/statuses, latest payment date, empty bills and missing student (mock DB)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
