const assert = require('node:assert/strict');
const { Prisma } = require('@prisma/client');
const { prisma } = require('../src/lib/prisma');
const {
  MidtransService,
  midtransSignature,
  parseMidtransNotification,
  verifyMidtransSignature,
} = require('../src/services/midtrans.service');
const {
  StudentPaymentService,
  mapMidtransStatus,
} = require('../src/services/student-services/student-payment.service');

const decimal = value => new Prisma.Decimal(value);
const serverKey = 'SB-Mid-server-test-only';

function notification(overrides = {}) {
  const body = {
    order_id: 'UKT-order-1',
    transaction_id: 'midtrans-transaction-1',
    transaction_status: 'settlement',
    fraud_status: 'accept',
    status_code: '200',
    gross_amount: '3000000.00',
    settlement_time: '2026-10-27 10:30:00',
    ...overrides,
  };
  body.signature_key = midtransSignature(body.order_id, body.status_code, body.gross_amount, serverKey);
  return body;
}

function paymentRow(overrides = {}) {
  return {
    id: 'payment-1',
    nomorPembayaran: 'PAY-1',
    nominal: decimal(3000000),
    metode: 'VIRTUAL_ACCOUNT',
    status: 'PENDING',
    sumber: 'PAYMENT_GATEWAY',
    reference: 'UKT-order-1',
    provider: 'MIDTRANS',
    providerOrderId: 'UKT-order-1',
    providerTransactionId: null,
    providerToken: null,
    providerRedirectUrl: null,
    expiresAt: new Date(Date.now() + 3600000),
    paidAt: null,
    createdAt: new Date('2026-10-27T00:00:00Z'),
    tagihan: {
      id: 'bill-1', nomorTagihan: 'UKT-1', nominal: decimal(5000000),
      jatuhTempo: new Date('2026-11-01T00:00:00Z'), status: 'SEBAGIAN',
      mahasiswa: { userId: 'student-user' },
      tahunAkademik: { id: 1, tahun: '2026/2027', semester: 'GANJIL' },
    },
    ...overrides,
  };
}

async function main() {
  const parsed = parseMidtransNotification(notification());
  assert.equal(parsed.orderId, 'UKT-order-1');
  assert.equal(verifyMidtransSignature(parsed, serverKey), true);
  assert.equal(verifyMidtransSignature({ ...parsed, signatureKey: '0'.repeat(128) }, serverKey), false);
  assert.throws(() => parseMidtransNotification({}), error => error.code === 'INVALID_MIDTRANS_NOTIFICATION');
  assert.equal(mapMidtransStatus('settlement', null), 'SUCCESS');
  assert.equal(mapMidtransStatus('capture', 'accept'), 'SUCCESS');
  assert.equal(mapMidtransStatus('pending', null), 'PENDING');
  assert.equal(mapMidtransStatus('expire', null), 'EXPIRED');
  assert.equal(mapMidtransStatus('cancel', null), 'CANCELLED');
  assert.equal(mapMidtransStatus('deny', null), 'FAILED');
  assert.throws(() => mapMidtransStatus('unknown', null), error => error.code === 'UNSUPPORTED_MIDTRANS_STATUS');

  const gateway = new MidtransService({ serverKey, isProduction: false });
  assert.doesNotThrow(() => gateway.verifyNotification(parsed));
  assert.throws(() => gateway.verifyNotification({ ...parsed, signatureKey: 'bad' }), error => error.code === 'INVALID_MIDTRANS_SIGNATURE');

  let createdData;
  let snapCalls = 0;
  const baseRow = paymentRow();
  const createTx = {
    tagihanUKT: {
      findFirst: async args => {
        assert.deepEqual(args.where, { id: 'bill-1', mahasiswa: { userId: 'student-user' } });
        return {
          id: 'bill-1', nomorTagihan: 'UKT-1', nominal: decimal(5000000),
          status: 'SEBAGIAN',
          mahasiswa: { user: { name: 'Student', email: 'student@example.test', phoneNumber: '08123456789' } },
        };
      },
    },
    pembayaranUKT: {
      findFirst: async () => null,
      aggregate: async () => ({ _sum: { nominal: decimal(2000000) } }),
      create: async args => { createdData = args.data; return baseRow; },
    },
    riwayatStatusPembayaran: { create: async () => { throw new Error('unexpected direct history create'); } },
  };
  prisma.$transaction = async fn => fn(createTx);
  prisma.pembayaranUKT.update = async args => paymentRow({
    providerToken: args.data.providerToken,
    providerRedirectUrl: args.data.providerRedirectUrl,
  });
  const created = await StudentPaymentService.createPayment('student-user', 'bill-1', {
    createSnapTransaction: async input => {
      snapCalls += 1;
      assert.equal(input.grossAmount, 3000000);
      assert.equal(input.customer.email, 'student@example.test');
      assert.equal(input.customer.phone, '08123456789');
      return { token: 'snap-token', redirectUrl: 'https://app.sandbox.midtrans.com/snap/v4/redirection/token' };
    },
    verifyNotification: () => {},
  });
  assert.equal(created.reused, false);
  assert.equal(created.payment.amount, 3000000);
  assert.equal(created.payment.snapToken, 'snap-token');
  assert.equal(createdData.nominal.equals(decimal(3000000)), true);
  assert.equal(createdData.sumber, 'PAYMENT_GATEWAY');
  assert.equal(snapCalls, 1);

  const pending = paymentRow({ providerToken: 'existing-token', providerRedirectUrl: 'https://existing.test' });
  prisma.$transaction = async fn => fn({
    tagihanUKT: createTx.tagihanUKT,
    pembayaranUKT: {
      aggregate: createTx.pembayaranUKT.aggregate,
      findFirst: async () => pending,
    },
  });
  const reused = await StudentPaymentService.createPayment('student-user', 'bill-1', {
    createSnapTransaction: async () => { throw new Error('duplicate Snap call'); },
    verifyNotification: () => {},
  });
  assert.equal(reused.reused, true);
  assert.equal(reused.payment.snapToken, 'existing-token');

  prisma.$transaction = async fn => fn({
    tagihanUKT: { findFirst: async () => null },
  });
  await assert.rejects(
    () => StudentPaymentService.createPayment('another-user', 'bill-1', {
      createSnapTransaction: async () => { throw new Error('unused'); },
      verifyNotification: () => {},
    }),
    error => error.code === 'BILL_NOT_FOUND',
  );

  let paymentState = paymentRow();
  const history = [];
  let billStatus = 'SEBAGIAN';
  const webhookTx = {
    pembayaranUKT: {
      findUnique: async args => {
        assert.deepEqual(args.where, { providerOrderId: 'UKT-order-1' });
        return {
          id: paymentState.id, tagihanId: paymentState.tagihan.id, nominal: paymentState.nominal,
          status: paymentState.status, sumber: paymentState.sumber, provider: paymentState.provider,
          providerTransactionId: paymentState.providerTransactionId, paidAt: paymentState.paidAt,
        };
      },
      update: async args => { paymentState = { ...paymentState, ...args.data }; return paymentState; },
      aggregate: async () => ({ _sum: { nominal: decimal(5000000) } }),
    },
    riwayatStatusPembayaran: { create: async args => { history.push(args.data); } },
    tagihanUKT: {
      findUnique: async () => ({ nominal: decimal(5000000) }),
      update: async args => { billStatus = args.data.status; },
    },
  };
  prisma.$transaction = async fn => fn(webhookTx);
  const verifiedGateway = {
    createSnapTransaction: async () => { throw new Error('unused'); },
    verifyNotification: value => gateway.verifyNotification(value),
  };
  const firstWebhook = await StudentPaymentService.handleMidtransWebhook(notification(), verifiedGateway);
  assert.deepEqual(firstWebhook, { received: true, paymentId: 'payment-1', status: 'SUCCESS' });
  assert.equal(paymentState.status, 'SUCCESS');
  assert.equal(paymentState.providerTransactionId, 'midtrans-transaction-1');
  assert.equal(history.length, 1);
  assert.equal(billStatus, 'LUNAS');
  await StudentPaymentService.handleMidtransWebhook(notification(), verifiedGateway);
  assert.equal(history.length, 1, 'duplicate webhook must not create duplicate history');

  await assert.rejects(
    () => StudentPaymentService.handleMidtransWebhook(notification({ gross_amount: '1.00' }), verifiedGateway),
    error => error.code === 'PAYMENT_AMOUNT_MISMATCH',
  );

  prisma.pembayaranUKT.findFirst = async args => {
    assert.deepEqual(args.where, { id: 'payment-1', tagihan: { mahasiswa: { userId: 'student-user' } } });
    return paymentState;
  };
  assert.equal((await StudentPaymentService.getPayment('student-user', 'payment-1')).id, 'payment-1');
  prisma.pembayaranUKT.findFirst = async () => null;
  await assert.rejects(() => StudentPaymentService.getPayment('another-user', 'payment-1'), error => error.code === 'PAYMENT_NOT_FOUND');

  const studentRoutes = require('../src/router/students').studentProfileRouter.stack;
  assert.ok(studentRoutes.some(layer => layer.route?.path === '/bills/:billId/pay' && layer.route.methods.post));
  assert.ok(studentRoutes.some(layer => layer.route?.path === '/payments/:paymentId' && layer.route.methods.get));
  const apiRouter = require('../src/router').default.stack;
  assert.ok(apiRouter.some(layer => layer.route?.path === '/api/v1/payments/midtrans/webhook' && layer.route.methods.post));

  console.log('PASS: Midtrans signature/status mapping, payment creation, pending reuse, ownership, webhook transitions and idempotency');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
