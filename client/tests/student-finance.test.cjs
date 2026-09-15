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
  const thunks = load('features/action/studentFinanceThunk.ts', {
    '@reduxjs/toolkit': rtk, '@/api/axios': { api }, '@/api/dashboard': { getDashboardYears: async () => [] },
    '@/components/master-data/master-api': { masterApi: { options: async () => [] }, masterError: error => error.message },
  })
  const logout = rtk.createAction('auth/logout')
  const auth = { logoutApi: rtk.createAsyncThunk('auth/logout', async () => {}), refreshToken: rtk.createAsyncThunk('auth/refresh', async () => {}) }
  const slice = load('features/slice/studentFinanceSlice.ts', { '@reduxjs/toolkit': rtk, '../action/studentFinanceThunk': thunks, './authSlice': { logout }, '../action/authThunk': auth })
  return { thunks, slice, logout, store: rtk.configureStore({ reducer: slice.default }) }
}
test('finance uses the user identifier, unwraps the envelope and supports abort', async () => {
  let call
  const payload = { summary: { totalBills: 50, totalPaid: 20, totalOutstanding: 30 }, bills: [] }
  const { store, thunks } = setup({ get: async (url, config) => { call = { url, config }; return { data: { data: payload } } } })
  await store.dispatch(thunks.getStudentFinance('user/id')).unwrap()
  assert.equal(call.url, '/students/user%2Fid/keuangan')
  assert.ok(call.config.signal instanceof AbortSignal)
  assert.equal(store.getState().data, payload)
})
test('switching students and closing the tab prevent stale responses', () => {
  const { store, thunks, slice } = setup()
  store.dispatch(thunks.getStudentFinance.pending('old', 'student-a'))
  store.dispatch(thunks.getStudentFinance.pending('new', 'student-b'))
  store.dispatch(thunks.getStudentFinance.fulfilled({ bills: ['old'] }, 'old', 'student-a'))
  assert.equal(store.getState().data, null)
  store.dispatch(slice.clearStudentFinance())
  store.dispatch(thunks.getStudentFinance.fulfilled({ bills: ['new'] }, 'new', 'student-b'))
  assert.equal(store.getState().data, null)
  assert.equal(store.getState().studentId, null)
})
test('errors are retryable, abort is silent and logout clears financial data', async () => {
  const { store, thunks, logout } = setup({ get: async () => { throw new Error('Server unavailable') } })
  await store.dispatch(thunks.getStudentFinance('student'))
  assert.equal(store.getState().error, 'Server unavailable')
  assert.equal(store.getState().loading, false)
  store.dispatch(thunks.getStudentFinance.pending('retry', 'student'))
  assert.equal(store.getState().error, null)
  store.dispatch(thunks.getStudentFinance.rejected({ name: 'AbortError' }, 'retry', 'student'))
  assert.equal(store.getState().error, null)
  store.dispatch(thunks.getStudentFinance.pending('success', 'student'))
  store.dispatch(thunks.getStudentFinance.fulfilled({ bills: [] }, 'success', 'student'))
  store.dispatch(logout())
  assert.equal(store.getState().data, null)
})
