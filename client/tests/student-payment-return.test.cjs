const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

function loadReturnHelpers() {
  const exports = {}
  const source = fs.readFileSync(
    path.join(__dirname, '../src/pages/mahasiswa/TagihanUKT/payment-return.ts'),
    'utf8',
  )
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 },
  }).outputText
  vm.runInNewContext(output, { exports, URLSearchParams })
  return exports
}

const helpers = loadReturnHelpers()

test('parses only a bounded Midtrans order reference and known back action', () => {
  assert.deepEqual(
    { ...helpers.parseMidtransReturn('?order_id=UKT-123&transaction_status=PENDING&action=back') },
    { orderId: 'UKT-123', transactionStatus: 'pending', action: 'back' },
  )
  assert.equal(helpers.parseMidtransReturn('?transaction_status=settlement'), null)
  assert.equal(helpers.parseMidtransReturn(`?order_id=${'a'.repeat(101)}`), null)
})

test('matches a returned transaction only by its provider order reference', () => {
  const payments = [
    { id: 'payment-1', providerOrderId: 'UKT-123', status: 'PENDING' },
    { id: 'payment-2', providerOrderId: 'UKT-456', status: 'SUCCESS' },
  ]
  const context = { orderId: 'UKT-456', transactionStatus: 'settlement', action: null }
  assert.equal(helpers.findReturnedPayment(payments, context).id, 'payment-2')
  assert.equal(helpers.findReturnedPayment(payments, { ...context, orderId: 'unknown' }), null)
})

test('rechecks pending payments after returning from Midtrans unless the user closed it', () => {
  const settled = { orderId: 'UKT-123', transactionStatus: 'settlement', action: null }
  assert.equal(helpers.shouldRecheckReturnedPayment({ status: 'PENDING' }, settled), true)
  assert.equal(helpers.shouldRecheckReturnedPayment({ status: 'SUCCESS' }, settled), false)
  assert.equal(helpers.shouldRecheckReturnedPayment(
    { status: 'PENDING' },
    { ...settled, action: 'back' },
  ), false)
  assert.equal(helpers.shouldRecheckReturnedPayment(
    { status: 'PENDING' },
    { ...settled, transactionStatus: 'pending' },
  ), true)
})
