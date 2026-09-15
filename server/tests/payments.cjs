const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { paymentFilters, verifyPaymentBody, cancelPaymentBody } = require('../src/validation/payments');
const { paymentWhere, listPayments, recalculateTuitionBill, changePaymentStatus } = require('../src/services/payments.service');
const { prisma } = require('../src/lib/prisma');
const { Controller } = require('../src/controllers/adminController');
const { S3Service } = require('../src/services/s3.service');
const D = value => new Prisma.Decimal(value);
async function main() {
  for (const query of [{ page: '0' }, { limit: '101' }, { academicYearId: [] }, { status: 'APPROVE' }, { method: 'CARD' }, { startDate: '2026-02-30' }, { startDate: '2026-10-01', endDate: '2026-09-01' }]) assert.throws(() => paymentFilters(query), e => e.name === 'BadRequest');
  for (const body of [{ decision: 'SUCCESS' }, { decision: 'APPROVE', verifiedById: 'spoof' }, { decision: 'REJECT', reason: '' }]) assert.throws(() => verifyPaymentBody(body));
  for (const body of [{}, { reason: ' ' }, { reason: 3 }]) assert.throws(() => cancelPaymentBody(body));
  const filters = paymentFilters({ academicYearId: '2', studyProgramId: '1', status: 'PENDING', method: 'TRANSFER_BANK', search: 'andi', startDate: '2026-09-01', endDate: '2026-09-30', page: '2', limit: '10' });
  assert.equal(filters.endDate.toISOString(), '2026-09-30T16:59:59.999Z');
  const where = paymentWhere(filters); assert.equal(where.status, 'PENDING'); assert.equal(where.tagihan.tahunAkademikId, 2); assert.equal(where.tagihan.mahasiswa.prodiId, 1); assert.equal(where.OR.length, 5); assert.equal(paymentWhere(filters, false).status, undefined);
  const row = { id: 'p1', nomorPembayaran: 'PAY-1', nominal: D(2000000), metode: 'TRANSFER_BANK', sumber: 'MANUAL', status: 'PENDING', paidAt: null,
    tagihan: { id: 'bill', nomorTagihan: 'UKT-1', nominal: D(5000000), jatuhTempo: new Date(), status: 'BELUM_DIBAYAR', tahunAkademik: { id: 2, tahun: '2026/2027', semester: 'GANJIL' }, mahasiswa: { id: 'student', userId: 'user', nim: '20251001', user: { name: 'Andi' }, prodi: { id: 1, name: 'Informatics' } } },
    reference: 'REF-1', buktiPembayaranKey: 'proof/private.jpg', verifiedAt: null, verifiedById: null, createdAt: new Date(), riwayatStatus: [] };
  const list = await listPayments({ pembayaranUKT: {
    groupBy: async args => { assert.equal(args.where.status, undefined); return [{ status: 'SUCCESS', _count: { _all: 2 }, _sum: { nominal: D(5000000) } }]; },
    count: async args => { assert.equal(args.where.status, 'PENDING'); return 11; },
    findMany: async args => { assert.equal(args.skip, 10); assert.equal(args.take, 10); return [row]; },
  } }, filters);
  assert.equal(list.summary.totalSuccessfulAmount, 5000000); assert.equal(list.summary.failedTransactions, 0); assert.equal(list.pagination.totalPages, 2);
  assert.equal(list.payments[0].student.userId, 'user'); assert.equal(list.payments[0].bill.type, 'UKT'); assert.equal(list.payments[0].amount, 2000000);
  for (const [total, expected] of [[0, 'BELUM_DIBAYAR'], [2, 'SEBAGIAN'], [5, 'LUNAS'], [6, 'LUNAS']]) {
    let status;
    await recalculateTuitionBill({ tagihanUKT: { findUnique: async () => ({ nominal: D(5) }), update: async args => { status = args.data.status; } }, pembayaranUKT: { aggregate: async args => { assert.equal(args.where.status, 'SUCCESS'); return { _sum: { nominal: D(total) } }; } } }, 'bill');
    assert.equal(status, expected);
  }
  function statefulTx(initial = 'PENDING') {
    const state = { status: initial, history: [], billStatus: 'BELUM_DIBAYAR', verifiedById: null, verifiedAt: null, paidAt: null };
    const tx = {
      pembayaranUKT: {
        findUnique: async () => ({ id: 'p1', tagihanId: 'bill', status: state.status, paidAt: state.paidAt }),
        updateMany: async args => { if (state.status !== args.where.status) return { count: 0 }; Object.assign(state, args.data); return { count: 1 }; },
        aggregate: async () => ({ _sum: { nominal: state.status === 'SUCCESS' ? D(2) : null } }),
      },
      riwayatStatusPembayaran: { create: async args => { state.history.push(args.data); } },
      tagihanUKT: { findUnique: async () => ({ nominal: D(5) }), update: async args => { state.billStatus = args.data.status; } },
    };
    return { state, tx };
  }
  for (const [action, expected] of [['APPROVE', 'SUCCESS'], ['REJECT', 'FAILED'], ['CANCEL', 'CANCELLED']]) {
    const { state, tx } = statefulTx();
    await changePaymentStatus(tx, 'p1', 'admin', action, 'Reviewed');
    assert.equal(state.status, expected); assert.equal(state.history[0].actorId, 'admin'); assert.equal(state.history[0].statusLama, 'PENDING'); assert.equal(state.history[0].statusBaru, expected);
    if (action !== 'CANCEL') { assert.equal(state.verifiedById, 'admin'); assert.ok(state.verifiedAt instanceof Date); }
    if (action === 'APPROVE') { assert.equal(state.billStatus, 'SEBAGIAN'); assert.ok(state.paidAt instanceof Date); }
    await assert.rejects(() => changePaymentStatus(tx, 'p1', 'admin', action), e => e.name === 'Conflict'); assert.equal(state.history.length, 1);
  }
  for (const status of ['SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED']) await assert.rejects(() => changePaymentStatus(statefulTx(status).tx, 'p1', 'admin', 'CANCEL', 'Reason'), e => e.name === 'Conflict');
  const race = statefulTx(); race.tx.pembayaranUKT.updateMany = async () => ({ count: 0 });
  await assert.rejects(() => changePaymentStatus(race.tx, 'p1', 'admin', 'APPROVE'), e => e.name === 'Conflict'); assert.equal(race.state.history.length, 0);
  await assert.rejects(() => changePaymentStatus({ pembayaranUKT: { findUnique: async () => null } }, 'missing', 'admin', 'APPROVE'), e => e.name === 'NotFound');
  // Emulate rollback to verify controller keeps all writes in a single transaction.
  const rollback = statefulTx(); rollback.tx.riwayatStatusPembayaran.create = async () => { throw new Error('history write failed'); };
  prisma.$transaction = async (fn, options) => { assert.equal(options.isolationLevel, 'Serializable'); const before = { ...rollback.state }; try { return await fn(rollback.tx); } catch (e) { Object.assign(rollback.state, before); throw e; } };
  let error;
  await Controller.verifyPayment({ params: { paymentId: 'p1' }, userLogin: { id: 'admin', role: 'Admin' }, body: { decision: 'APPROVE' } }, {}, e => { error = e; });
  assert.equal(error.message, 'history write failed'); assert.equal(rollback.state.status, 'PENDING');
  let result;
  prisma.$transaction = async fn => fn({ pembayaranUKT: { findUnique: async () => row } });
  S3Service.createReadUrl = async key => { assert.equal(key, 'proof/private.jpg'); return 'signed-proof-url'; };
  const response = { status(code) { assert.equal(code, 200); return this; }, json(value) { result = value; } };
  await Controller.getPaymentById({ params: { paymentId: 'p1' } }, response, e => { throw e; });
  assert.equal(result.data.proofUrl, 'signed-proof-url'); assert.equal(result.data.proofKey, undefined);
  row.buktiPembayaranKey = null;
  await Controller.getPaymentById({ params: { paymentId: 'p1' } }, response, e => { throw e; }); assert.equal(result.data.proofUrl, null);
  const router = require('../src/router/admin').default;
  const routes = router.stack.filter(layer => layer.route?.path.startsWith('/payments'));
  assert.equal(routes.length, 4); for (const layer of routes) assert.equal(layer.route.stack[0].handle, require('../src/middleware/authMid').adminMiddleware);
  await Controller.verifyPayment({ userLogin: { id: 'student', role: 'Mahasiswa' } }, {}, e => { error = e; }); assert.equal(error.name, 'Forbidden');
  console.log('PASS: payment filters, mapping, transitions, audit actor, balance recalculation, race guards, transactional error handling, proof URLs and admin routes (mock DB)');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
