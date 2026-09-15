const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { billListQuery } = require('../src/validation/tuition');
const { listTuitionBills } = require('../src/services/tuition.service');
const { prisma } = require('../src/lib/prisma');
const { Controller } = require('../src/controllers/adminController');

async function main() {
  assert.equal(billListQuery({}).limit, 10);
  for (const query of [{ page: 0 }, { limit: 101 }, { status: 'SUCCESS' }, { prodiId: [] }, { search: {} }]) {
    assert.throws(() => billListQuery(query), error => error.name === 'BadRequest');
  }
  const filters = billListQuery({ tahunAkademikId: '3', prodiId: '1', search: ' andi%_ ', status: 'BELUM_DIBAYAR', page: '2', limit: '10' });
  const queries = [];
  const summary = { totalBills: 12n, paid: 5n, unpaid: 6n, overdue: 1n, totalAmount: new Prisma.Decimal(60000000), paidAmount: new Prisma.Decimal(25000000), outstandingAmount: new Prisma.Decimal(35000000) };
  const row = { prodiId: 1, studyProgramName: 'Teknik Informatika', id: 'bill', nomorTagihan: 'UKT-2026-000001', userId: 'user', mahasiswaId: 'student', nim: '20240001', name: 'Andi', tahunAkademikId: 3, tahun: '2026/2027', semester: 'GANJIL', nominal: new Prisma.Decimal(5000000), paidAmount: new Prisma.Decimal(0), remainingAmount: new Prisma.Decimal(5000000), jatuhTempo: new Date('2026-09-30T16:59:59.999Z'), effectiveStatus: 'BELUM_DIBAYAR' };
  const tx = { $queryRaw: async query => { queries.push(query); return [[summary], [{ total: 11n }], [row]][queries.length - 1]; } };
  const data = await listTuitionBills(tx, filters, new Date('2026-09-14T00:00:00Z'));
  assert.deepEqual(data.pagination, { page: 2, limit: 10, totalRows: 11, totalPages: 2 });
  assert.equal(data.summary.totalBills, 12);
  assert.deepEqual(data.bills[0].student, { id: 'user', studentId: 'student', nim: '20240001', name: 'Andi', studyProgram: { id: 1, name: 'Teknik Informatika' } });
  assert.equal(data.bills[0].dueDate, '2026-09-30');
  assert.equal(data.bills[0].remainingAmount, 5000000);
  assert.doesNotThrow(() => JSON.stringify(data));
  assert.ok(queries[0].values.includes('%andi\\%\\_%'));
  assert.ok(!queries[0].values.includes('BELUM_DIBAYAR'));
  assert.ok(queries[1].values.includes('BELUM_DIBAYAR'));
  assert.deepEqual(queries[2].values.slice(-2), [10, 10]);
  let index = 0;
  const zero = Object.fromEntries(Object.keys(summary).map(key => [key, 0n]));
  prisma.$transaction = async (fn, options) => {
    assert.equal(options.isolationLevel, 'RepeatableRead');
    return fn({ $queryRaw: async () => [[zero], [{ total: 0n }], []][index++] });
  };
  let result;
  await Controller.getUKTBills({ query: {} }, { status(code) { assert.equal(code, 200); return this; }, json(value) { result = value; } }, error => { throw error; });
  assert.equal(result.message, 'Tuition bills retrieved successfully');
  assert.deepEqual(result.data.bills, []);
  assert.equal(result.data.pagination.totalPages, 0);
  const failure = new Error('database unavailable');
  prisma.$transaction = async () => { throw failure; };
  let forwarded;
  await Controller.getUKTBills({ query: {} }, {}, error => { forwarded = error; });
  assert.equal(forwarded, failure);
  console.log('PASS: query validation, parameter binding, summary scope, response mapping, pagination, empty result and error forwarding (mock DB)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
