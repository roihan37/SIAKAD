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
  const thunks = load('features/action/tuitionThunk.ts', {
    '@reduxjs/toolkit': rtk, '@/api/axios': { api }, '@/api/dashboard': { getDashboardYears: async () => [] },
    '@/components/master-data/master-api': { masterApi: { options: async () => [] }, masterError: error => error.message },
  })
  const logout = rtk.createAction('auth/logout')
  const auth = { logoutApi: rtk.createAsyncThunk('auth/logout', async () => {}), refreshToken: rtk.createAsyncThunk('auth/refresh', async () => {}) }
  const slice = load('features/slice/tuitionSlice.ts', { '@reduxjs/toolkit': rtk, '../action/tuitionThunk': thunks, './authSlice': { logout }, '../action/authThunk': auth })
  return { thunks, slice, logout, store: rtk.configureStore({ reducer: slice.default }) }
}
test('list and generate send the exact server path, params and payload', async () => {
  const calls = []
  const { thunks, store } = setup({ get: async (url, config) => { calls.push({ url, config }); return { data: { data: { bills: [] } } } }, post: async (url, body) => { calls.push({ url, body }); return { data: { data: { generated: 2, skipped: 1 } } } } })
  const query = { tahunAkademikId: 3, prodiId: 2, search: 'Andi', status: 'SEBAGIAN', page: 2, limit: 10 }
  const body = { tahunAkademikId: 3, prodiId: 2, angkatan: 2024, nominal: '4500000.50', jatuhTempo: '2026-12-31' }
  await store.dispatch(thunks.getTuitionBills(query)).unwrap()
  const result = await store.dispatch(thunks.generateTuitionBills(body)).unwrap()
  assert.equal(calls[0].url, '/admin/ukt/bills'); assert.equal(calls[0].config.params, query)
  assert.ok(calls[0].config.signal instanceof AbortSignal)
  assert.equal(calls[1].url, '/admin/ukt/bills/generate'); assert.equal(calls[1].body, body)
  assert.deepEqual(result, { generated: 2, skipped: 1 })
})
test('filters reset pagination and reject old in-flight data', () => {
  const { thunks, slice, store } = setup()
  store.dispatch(slice.setBillPage(3))
  store.dispatch(thunks.getTuitionBills.pending('old', {}))
  store.dispatch(slice.setBillFilters({ prodiId: 2 }))
  store.dispatch(thunks.getTuitionBills.fulfilled({ bills: ['stale'] }, 'old', {}))
  assert.equal(store.getState().page, 1); assert.equal(store.getState().data, null)
  store.dispatch(thunks.getTuitionBills.pending('new', {}))
  store.dispatch(thunks.getTuitionBills.fulfilled({ bills: ['current'] }, 'new', {}))
  assert.equal(store.getState().data.bills[0], 'current')
})
test('list failure and generation failure stay separate; abort is silent', async () => {
  const { thunks, store } = setup({ get: async () => { throw new Error('List failed') }, post: async () => { throw new Error('Generate failed') } })
  await store.dispatch(thunks.getTuitionBills({}))
  await store.dispatch(thunks.generateTuitionBills({}))
  assert.equal(store.getState().error, 'List failed'); assert.equal(store.getState().generateError, 'Generate failed')
  assert.equal(store.getState().loading, false); assert.equal(store.getState().generating, false)
  store.dispatch(thunks.getTuitionBills.pending('abort', {}))
  store.dispatch(thunks.getTuitionBills.rejected({ name: 'AbortError' }, 'abort', {}))
  assert.equal(store.getState().error, null)
})
test('reset preserves selected academic year; logout ignores pending generation response', () => {
  const { thunks, store, slice, logout } = setup()
  store.dispatch(slice.setBillFilters({ tahunAkademikId: 3, prodiId: 2, search: 'A', status: 'LUNAS' }))
  store.dispatch(slice.resetBillFilters())
  assert.equal(store.getState().filters.tahunAkademikId, 3); assert.equal(store.getState().filters.prodiId, undefined)
  store.dispatch(thunks.generateTuitionBills.pending('generation', {})); store.dispatch(logout())
  store.dispatch(thunks.generateTuitionBills.rejected(new Error(), 'generation', {}, 'stale'))
  assert.equal(store.getState().generateError, null)
})
