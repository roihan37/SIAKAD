const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const rtk = require('@reduxjs/toolkit')
function load(file, dependencies) {
  const exports = {}
  const source = fs.readFileSync(path.join(__dirname, '../src', file), 'utf8')
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, { exports, require: name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`)
    return dependencies[name]
  } })
  return exports
}
function setup(api = {}) {
  const thunks = load('features/action/paymentThunk.ts', {
    '@reduxjs/toolkit': rtk, '@/api/axios': { api }, '@/api/dashboard': { getDashboardYears: async () => [] },
    '@/components/master-data/master-api': { masterApi: { options: async () => [] }, masterError: error => error.message },
  })
  const logout = rtk.createAction('auth/logout')
  const auth = { logoutApi: rtk.createAsyncThunk('auth/logout', async () => {}), refreshToken: rtk.createAsyncThunk('auth/refresh', async () => {}) }
  const slice = load('features/slice/paymentSlice.ts', { '@reduxjs/toolkit': rtk, '../action/paymentThunk': thunks, './authSlice': { logout }, '../action/authThunk': auth })
  return { thunks, slice, logout, store: rtk.configureStore({ reducer: slice.default }) }
}
test('all four endpoints use real payment IDs and exact mutation bodies', async () => {
  const calls = []
  const { thunks, store } = setup({
    get: async (url, config) => { calls.push({ url, config }); return { data: { data: url === '/admin/payments' ? { payments: [], pagination: { totalPages: 1 } } : { id: 'payment/id' } } } },
    patch: async (url, body) => { calls.push({ url, body }); return { data: { data: { id: 'payment/id', status: 'SUCCESS' } } } },
  })
  const query = { academicYearId: 3, studyProgramId: 2, method: 'CASH', status: 'PENDING', search: 'Andi', startDate: '2026-09-01', endDate: '2026-09-30', page: 2, limit: 10 }
  await store.dispatch(thunks.getPayments(query)).unwrap()
  await store.dispatch(thunks.getPaymentDetail('payment/id')).unwrap()
  await store.dispatch(thunks.verifyPayment({ id: 'payment/id', decision: 'REJECT', reason: 'Invalid proof' })).unwrap()
  await store.dispatch(thunks.cancelPayment({ id: 'payment/id', reason: 'Duplicate' })).unwrap()
  assert.deepEqual(calls.map(call => call.url), ['/admin/payments', '/admin/payments/payment%2Fid', '/admin/payments/payment%2Fid/verify', '/admin/payments/payment%2Fid/cancel'])
  assert.equal(calls[0].config.params, query)
  assert.ok(calls[1].config.signal instanceof AbortSignal)
  assert.equal(JSON.stringify(calls[2].body), JSON.stringify({ decision: 'REJECT', reason: 'Invalid proof' }))
  assert.equal(JSON.stringify(calls[3].body), JSON.stringify({ reason: 'Duplicate' }))
})
test('filters reset page and invalidate old responses; closed detail cannot reappear', () => {
  const { thunks, slice, store } = setup()
  store.dispatch(slice.setPaymentPage(4))
  store.dispatch(thunks.getPayments.pending('old', {}))
  store.dispatch(slice.setPaymentFilters({ search: 'Aisyah' }))
  store.dispatch(thunks.getPayments.fulfilled({ payments: ['stale'], pagination: { totalPages: 1 } }, 'old', {}))
  assert.equal(store.getState().page, 1); assert.equal(store.getState().list.data, null)
  store.dispatch(thunks.getPaymentDetail.pending('detail', 'old'))
  store.dispatch(slice.clearPaymentDetail())
  store.dispatch(thunks.getPaymentDetail.fulfilled({ id: 'old' }, 'detail', 'old'))
  assert.equal(store.getState().detail.data, null)
})
test('mutation errors survive detail reload and are cleared on next dialog; logout ignores late mutation', async () => {
  const { store, thunks, slice, logout } = setup({ patch: async () => { throw new Error('Conflict') } })
  await store.dispatch(thunks.verifyPayment({ id: 'a', decision: 'APPROVE' }))
  assert.equal(store.getState().mutation.error, 'Conflict')
  store.dispatch(slice.clearPaymentDetail()); store.dispatch(thunks.getPaymentDetail.pending('refresh', 'a'))
  assert.equal(store.getState().mutation.error, 'Conflict')
  store.dispatch(slice.clearPaymentMutationError()); assert.equal(store.getState().mutation.error, null)
  store.dispatch(thunks.cancelPayment.pending('mutation', { id: 'a', reason: 'Test' })); store.dispatch(logout())
  store.dispatch(thunks.cancelPayment.rejected(new Error('Failed'), 'mutation', {}, 'Late'))
  assert.equal(store.getState().mutation.error, null)
})
test('export collects all pages without replacing displayed list or changing pagination', async () => {
  const { store, thunks, slice } = setup({ get: async (_, { params }) => ({ data: { data: { payments: [{ id: String(params.page) }], pagination: { totalPages: 2 } } } }) })
  store.dispatch(slice.setPaymentPage(3))
  const rows = await store.dispatch(thunks.exportPaymentRows({ search: '' })).unwrap()
  assert.equal(rows.length, 2); assert.equal(rows[1].id, '2')
  assert.equal(store.getState().page, 3); assert.equal(store.getState().list.data, null)
})
test('manual action eligibility uses source and status; missing paidAt is not invented', () => {
  const { canReview, dateLabel, statusLabels } = load('pages/Pembayaran/payment-format.ts', {})
  assert.equal(canReview({ status: 'PENDING', source: 'MANUAL' }), true)
  assert.equal(canReview({ status: 'PENDING', source: 'PAYMENT_GATEWAY' }), false)
  assert.equal(canReview({ status: 'SUCCESS', source: 'MANUAL' }), false)
  assert.equal(dateLabel(null), '—'); assert.equal(statusLabels.EXPIRED, 'Kedaluwarsa')
})
