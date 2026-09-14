const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../src/lib/prisma');
const { Controller } = require('../src/controllers/studentController');
const { getStudentFinance } = require('../src/services/tuition.service');
const D = value => new Prisma.Decimal(value);
async function main() {
  let yearId = 3;
  let rows = [{ id: 'bill', nomorTagihan: 'UKT-1', nominal: D(5000000), jatuhTempo: new Date('2026-09-30T16:59:59.999Z'),
    tahunAkademik: { id: 3, tahun: '2026/2027', semester: 'GANJIL' }, pembayaran: [
      { id: 'p1', nomorPembayaran: 'PAY-1', nominal: D(2000000), metode: 'TRANSFER_BANK', status: 'SUCCESS', paidAt: new Date('2026-09-14T03:00:00Z') },
      { id: 'p2', nomorPembayaran: 'PAY-2', nominal: D(3000000), metode: 'TRANSFER_BANK', status: 'PENDING', paidAt: null },
      { id: 'p3', nomorPembayaran: 'PAY-3', nominal: D(3000000), metode: 'TRANSFER_BANK', status: 'FAILED', paidAt: null },
    ] }];
  const tx = {
    mahasiswa: { findUnique: async args => { assert.equal(args.where.userId, 'student-user'); return { id: 'student' }; } },
    tahunAkademik: { findUnique: async args => { assert.equal(args.where.id, 3); return { id: 3 }; } },
    tagihanUKT: { findMany: async args => { assert.deepEqual(args.where, { mahasiswaId: 'student', ...(yearId === undefined ? {} : { tahunAkademikId: yearId }) }); return rows; } },
  };
  const now = new Date('2026-09-14T00:00:00Z');
  const data = await getStudentFinance(tx, 'student-user', 3, now);
  assert.deepEqual(data.summary, { totalBills: 5000000, totalPaid: 2000000, totalOutstanding: 3000000 });
  assert.equal(data.bills[0].status, 'SEBAGIAN');
  assert.equal(data.bills[0].payments.length, 3);
  assert.deepEqual(data.bills[0].payments[0], { id: 'p1', paymentNumber: 'PAY-1', amount: 2000000, method: 'TRANSFER_BANK', status: 'SUCCESS', paidAt: '2026-09-14T03:00:00.000Z' });
  assert.equal(data.bills[0].payments[1].paidAt, null);
  assert.equal(data.bills[0].dueDate, '2026-09-30');
  yearId = undefined;
  await getStudentFinance(tx, 'student-user', undefined, now);
  rows = [];
  yearId = 3;
  prisma.$transaction = async (fn, options) => { assert.equal(options.isolationLevel, 'RepeatableRead'); return fn(tx); };
  let response;
  await Controller.getFinanceyId({ params: { id: 'student-user' }, query: { tahunAkademikId: '3' } }, {
    status(code) { assert.equal(code, 200); return this; }, json(value) { response = value; },
  }, error => { throw error; });
  assert.deepEqual(response, { message: 'Student financial data retrieved successfully', data: { summary: { totalBills: 0, totalPaid: 0, totalOutstanding: 0 }, bills: [] } });
  for (const value of ['0', 'abc', ['3']]) {
    let error;
    await Controller.getFinanceyId({ params: { id: 'student-user' }, query: { tahunAkademikId: value } }, {}, e => { error = e; });
    assert.equal(error.name, 'BadRequest');
  }
  await assert.rejects(() => getStudentFinance({ ...tx, tahunAkademik: { findUnique: async () => null } }, 'student-user', 3, now), e => e.name === 'NotFound');
  await assert.rejects(() => getStudentFinance({ mahasiswa: { findUnique: async () => null } }, 'missing', 3, now), e => e.name === 'NotFound');
  const router = require('../src/router/students').default;
  const route = router.stack.find(layer => layer.route?.path === '/:id/keuangan').route;
  assert.equal(route.stack[0].handle, require('../src/middleware/authMid').adminMiddleware);
  assert.equal(route.stack[1].handle, Controller.getFinanceyId);
  console.log('PASS: finance filters, successful-payment totals, payment history, response, empty results, errors and admin route (mock DB)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
