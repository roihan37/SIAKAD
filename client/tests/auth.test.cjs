const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const axios = require('axios')
const rtk = require('@reduxjs/toolkit')
const session = (token = 'test-token', role = 'Admin', mustChangePassword = false) => ({ accessToken: token, user: { id: 'test-user', role, mustChangePassword } })
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const rejectHttp = (config, status, code, headers = {}) => Promise.reject(new axios.AxiosError('Request failed', undefined, config, undefined, { status, data: { code, message: code }, headers, config }))
function setup(handler, options = {}) {
  const cache = new Map()
  const calls = []
  const axiosMock = { ...axios, default: axios, create: config => axios.create({ ...config, adapter: async request => {
    calls.push(request)
    const data = await handler(request)
    return { data, status: 200, statusText: 'OK', headers: {}, config: request }
  } }) }
  axiosMock.default = axiosMock
  function load(file) {
    const full = path.resolve(__dirname, '../src', file)
    if (cache.has(full)) return cache.get(full).exports
    const module = { exports: {} }; cache.set(full, module)
    const source = fs.readFileSync(full, 'utf8').replaceAll('import.meta.env.VITE_API_URL', '"http://test/api/v1/"').replaceAll('import.meta.env.DEV', 'false')
    const js = ts.transpileModule(source, { fileName: full, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText
    vm.runInNewContext(js, { module, exports: module.exports, TextEncoder, URL, AbortController, setTimeout, clearTimeout, navigator: options.navigator ?? {}, BroadcastChannel: options.BroadcastChannel,
      require: name => {
        if (name === 'axios') return axiosMock
        if (name.startsWith('@/') || name.startsWith('.')) {
          const target = name.startsWith('@/') ? path.resolve(__dirname, '../src', name.slice(2)) : path.resolve(path.dirname(full), name)
          const resolved = ['.ts', '.tsx', '/index.ts'].map(ext => target + ext).find(candidate => fs.existsSync(candidate))
          return load(path.relative(path.resolve(__dirname, '../src'), resolved))
        }
        return require(name)
      },
    }, { filename: full })
    return module.exports
  }
  const api = load('api/axios.ts')
  const auth = load('features/slice/authSlice.ts')
  const thunks = load('features/action/authThunk.ts')
  const store = rtk.configureStore({ reducer: { auth: auth.default } }); api.injectStore(store)
  return { api, auth, thunks, store, calls, load }
}
test('login success/failure use identifier and preserve complete session; refresh updates role and required password', async () => {
  let fail = true
  const t = setup(config => config.url === '/auth/login' ? fail ? rejectHttp(config, 401, 'INVALID_CREDENTIALS') : session() : session('new', 'Dosen', true))
  await t.store.dispatch(t.thunks.login({ identifier: 'user', password: 'not-a-real-password' }))
  assert.equal(t.store.getState().auth.error.code, 'INVALID_CREDENTIALS'); assert.equal(t.calls.length, 1)
  fail = false; await t.store.dispatch(t.thunks.login({ identifier: 'user', password: 'not-a-real-password' })).unwrap()
  assert.equal(JSON.parse(t.calls[1].data).identifier, 'user')
  await t.api.refreshSession()
  assert.equal(t.store.getState().auth.user.role, 'Dosen'); assert.equal(t.store.getState().auth.user.mustChangePassword, true)
  assert.equal(t.store.getState().auth.accessToken, 'new')
})
test('bootstrap waits for refresh; network and 500 failures do not destroy an existing session', async () => {
  const response = deferred(); const t = setup(() => response.promise)
  const request = t.store.dispatch(t.thunks.refreshToken())
  assert.equal(t.store.getState().auth.initialized, false)
  response.resolve(session()); await request.unwrap(); assert.equal(t.store.getState().auth.initialized, true)
  for (const status of [undefined, 500]) {
    const x = setup(config => status ? rejectHttp(config, status, 'SERVER_ERROR') : Promise.reject(new axios.AxiosError('Network Error')))
    x.store.dispatch(x.auth.sessionReceived(session()))
    await x.store.dispatch(x.thunks.refreshToken())
    assert.equal(x.store.getState().auth.accessToken, 'test-token')
    assert.ok(x.store.getState().auth.recoveryError)
  }
})
test('parallel TOKEN_EXPIRED requests share one refresh and retry with the latest token', async () => {
  let refreshes = 0
  const t = setup(config => {
    if (config.url === '/auth/refreshTokens') { refreshes++; return session('fresh') }
    if (config.headers.get('Authorization') !== 'Bearer fresh') return rejectHttp(config, 401, 'TOKEN_EXPIRED')
    return { ok: true }
  })
  t.store.dispatch(t.auth.sessionReceived(session('expired')))
  await Promise.all([t.api.api.get('/a'), t.api.api.get('/b'), t.api.api.get('/c')])
  assert.equal(refreshes, 1); assert.equal(t.calls.length, 7)
})
test('retry is bounded; invalid token clears session; forbidden does not refresh', async () => {
  const t = setup(config => config.url === '/auth/refreshTokens' ? session('new') : rejectHttp(config, 401, 'TOKEN_EXPIRED'))
  t.store.dispatch(t.auth.sessionReceived(session()))
  await assert.rejects(t.api.api.get('/a')); assert.equal(t.calls.length, 3)
  for (const [status, code, signedIn] of [[401, 'TOKEN_INVALID', false], [403, 'FORBIDDEN', true]]) {
    const x = setup(config => rejectHttp(config, status, code)); x.store.dispatch(x.auth.sessionReceived(session()))
    await assert.rejects(x.api.api.get('/a')); assert.equal(!!x.store.getState().auth.accessToken, signedIn); assert.equal(x.calls.length, 1)
  }
})
test('refresh 401 ends session; cookie-only endpoints never recurse', async () => {
  const t = setup(config => rejectHttp(config, 401, config.url === '/auth/refreshTokens' ? 'INVALID_CREDENTIALS' : 'TOKEN_EXPIRED'))
  t.store.dispatch(t.auth.sessionReceived(session())); await assert.rejects(t.api.api.get('/a'))
  assert.equal(t.store.getState().auth.accessToken, null); assert.equal(t.calls.length, 2)
  for (const url of ['/auth/login', '/auth/refreshTokens', '/auth/logout']) {
    const x = setup(config => rejectHttp(config, 401, 'TOKEN_EXPIRED')); await assert.rejects(x.api.api.post(url)); assert.equal(x.calls.length, 1)
  }
})
test('logout wins over late refresh and late login; logout never carries a bearer token', async () => {
  for (const operation of ['refresh', 'login']) {
    const response = deferred()
    const t = setup(config => config.url === '/auth/logout' ? {} : response.promise)
    const pending = operation === 'refresh' ? t.api.refreshSession() : t.api.loginSession({ identifier: 'user', password: 'test' })
    const rejected = assert.rejects(pending)
    await new Promise(resolve => setImmediate(resolve))
    const ending = t.api.endSession(); response.resolve(session('late')); await rejected; await ending
    assert.equal(t.store.getState().auth.accessToken, null)
    const call = t.calls.find(config => config.url === '/auth/logout'); assert.ok(call); assert.equal(call.headers.get('Authorization'), undefined)
  }
})
test('PASSWORD_CHANGE_REQUIRED gates session; wrong current password keeps it; successful change clears it', async () => {
  let changing = false
  const t = setup(config => config.url === '/auth/change-password' ? changing ? {} : rejectHttp(config, 401, 'INVALID_CREDENTIALS') : rejectHttp(config, 403, 'PASSWORD_CHANGE_REQUIRED'))
  t.store.dispatch(t.auth.sessionReceived(session())); await assert.rejects(t.api.api.get('/a'))
  assert.equal(t.store.getState().auth.user.mustChangePassword, true)
  const body = { currentPassword: 'old-test-password', newPassword: 'new-test-password' }
  await t.store.dispatch(t.thunks.changePassword(body)); assert.ok(t.store.getState().auth.accessToken)
  changing = true; await t.store.dispatch(t.thunks.changePassword(body)).unwrap(); assert.equal(t.store.getState().auth.accessToken, null)
})
test('429 parses Retry-After and suppresses refresh attempts during cooldown; unicode password byte limit', async () => {
  const t = setup(config => rejectHttp(config, 429, 'RATE_LIMITED', { 'retry-after': '120' }))
  const result = await t.store.dispatch(t.thunks.refreshToken())
  assert.ok(result.payload.retryAt > Date.now() + 118000)
  await assert.rejects(t.api.refreshSession()); assert.equal(t.calls.length, 1)
  const { validatePassword } = t.load('api/auth-errors.ts')
  assert.equal(validatePassword('old', 'abcdefghijkl', 'abcdefghijkl'), null)
  assert.ok(validatePassword('old', 'a'.repeat(73), 'a'.repeat(73)))
  assert.ok(validatePassword('old', '😀'.repeat(19), '😀'.repeat(19)))
  assert.ok(validatePassword('old', 'abcdefghijkl', 'different'))
})
test('cross-tab lock serializes refresh and cross-tab logout prevents queued refresh restoring state', async () => {
  let tail = Promise.resolve(); let active = 0; let maximum = 0
  const navigator = { locks: { request: (_, fn) => { const result = tail.then(fn); tail = result.catch(() => {}); return result } } }
  const transport = async () => { active++; maximum = Math.max(maximum, active); await new Promise(resolve => setTimeout(resolve, 5)); active--; return session() }
  const a = setup(transport, { navigator }); const b = setup(transport, { navigator })
  await Promise.all([a.api.refreshSession(), b.api.refreshSession()]); assert.equal(maximum, 1)
  const response = deferred(); const c = setup(() => response.promise, { navigator })
  const pending = c.api.refreshSession(); const rejection = assert.rejects(pending)
  c.api.sessions.external('logout'); response.resolve(session('late')); await rejection
  assert.equal(c.store.getState().auth.accessToken, null)
})
test('root store purges every domain and rejects late legacy responses after new login', () => {
  const t = setup(() => ({})); const { store } = t.load('app/store.ts')
  const { getAllProdi } = t.load('features/action/campusThunk.ts')
  store.dispatch(t.auth.sessionReceived(session()))
  store.dispatch(getAllProdi.pending('loaded', {}))
  store.dispatch(getAllProdi.fulfilled({ prodi: [{ id: 1, name: 'Private data' }], pagination: { totalPages: 1 } }, 'loaded', {}))
  assert.equal(store.getState().campus.prodi.length, 1)
  store.dispatch(getAllProdi.pending('old', {}))
  store.dispatch(t.auth.logout())
  assert.equal(store.getState().auth.accessToken, null)
  assert.equal(store.getState().students.studentDetail, null)
  assert.equal(store.getState().campus.prodi.length, 0)
  store.dispatch(t.auth.sessionReceived({ ...session(), user: { ...session().user, id: 'new-user' } }))
  const current = store.getState()
  store.dispatch(getAllProdi.fulfilled({ prodi: [{ id: 1, name: 'Stale data' }], pagination: { totalPages: 1 } }, 'old', {}))
  assert.equal(store.getState(), current)
})
test('protected UI preserves forced password gate and RoleGuard blocks non-admin content', () => {
  const React = require('react')
  const { renderToString } = require('react-dom/server')
  const { Provider } = require('react-redux')
  const { MemoryRouter, Routes, Route } = require('react-router')
  for (const [role, mustChangePassword, expected] of [['Dosen', false, null], ['Mahasiswa', false, null], ['Admin', true, 'Ganti password']]) {
    const t = setup(() => ({})); t.store.dispatch(t.auth.sessionReceived(session('test', role, mustChangePassword)))
    const ProtectedRoute = t.load('components/protect-web/ProtectedRoute.tsx').default
    const RoleGuard = t.load('components/protect-web/RoleGuard.tsx').default
    const tree = React.createElement(Provider, { store: t.store }, React.createElement(MemoryRouter, { initialEntries: ['/dashboard'] }, React.createElement(Routes, null, React.createElement(Route, { element: React.createElement(ProtectedRoute) }, React.createElement(Route, { element: React.createElement(RoleGuard, { role: 'Admin' }) }, React.createElement(Route, { path: '/dashboard', element: React.createElement('p', null, 'ADMIN-SECRET-PAGE') }))))))
    const html = renderToString(tree)
    if (expected) assert.ok(html.includes(expected)); assert.ok(!html.includes('ADMIN-SECRET-PAGE'))
  }
})
test('failed logout removes local identity and exposes a retryable error, without resurrecting refresh', async () => {
  const t = setup(config => config.url === '/auth/logout' ? Promise.reject(new axios.AxiosError('Network Error')) : session('late'))
  t.store.dispatch(t.auth.sessionReceived(session()))
  await t.store.dispatch(t.thunks.logoutApi())
  assert.equal(t.store.getState().auth.accessToken, null)
  assert.ok(t.store.getState().auth.logoutError)
  const count = t.calls.length
  await assert.rejects(t.api.refreshSession()); assert.equal(t.calls.length, count)
})
test('HTTP-date Retry-After is parsed and a bootstrap network outage keeps initialization gated', async () => {
  const t = setup(() => Promise.reject(new axios.AxiosError('Network Error')))
  await t.store.dispatch(t.thunks.refreshToken())
  assert.equal(t.store.getState().auth.initialized, false)
  assert.ok(t.store.getState().auth.recoveryError)
  const { authFailure } = t.load('api/auth-errors.ts')
  const until = new Date(Date.now() + 120000).toUTCString()
  const error = new axios.AxiosError('Throttled', undefined, undefined, undefined, { status: 429, headers: { 'retry-after': until }, data: {} })
  assert.equal(authFailure(error).retryAt, Date.parse(until))
})

test('role homes and real route registry preserve admin nesting and avoid student detail collisions', () => {
  const t = setup(() => ({}))
  const { roleHome } = t.load('router/role-paths.ts')
  assert.equal(roleHome('Admin'), '/admin/dashboard')
  assert.equal(roleHome('Mahasiswa'), '/mahasiswa/dashboard')
  assert.equal(roleHome('Dosen'), '/dosen/dashboard')
  assert.equal(roleHome('unknown'), '/akses-terbatas')
  const { routes } = t.load('router/routes.tsx')
  const { matchRoutes } = require('react-router')
  for (const pathname of ['/admin/dashboard', '/admin/mahasiswa/a/edit', '/admin/pembayaran', '/admin/nilai', '/admin/skripsi']) {
    const matches = matchRoutes(routes, pathname)
    assert.ok(matches.some(match => match.route.path === '/admin'))
    assert.equal(matches[1].route.element.props.role, 'Admin')
  }
  for (const [pathname, role] of [['/mahasiswa/dashboard', 'Mahasiswa'], ['/dosen/dashboard', 'Dosen']]) {
    const matches = matchRoutes(routes, pathname)
    assert.equal(matches.at(-1).route.path, "dashboard")
    assert.equal(matches[1].route.element.props.role, role)
  }
  assert.equal(matchRoutes(routes, '/mahasiswa/legacy-id').at(-1).route.path, '/mahasiswa/:id')
})

test('every portal navigation item resolves inside its own role layout', () => {
  const t = setup(() => ({}))
  const { routes } = t.load('router/routes.tsx')
  const { matchRoutes } = require('react-router')
  for (const [basePath, role, file, exportName] of [
    ['/mahasiswa', 'Mahasiswa', 'mahasiswa-navigation', 'mahasiswaNavigation'],
    ['/dosen', 'Dosen', 'dosen-navigation', 'dosenNavigation'],
  ]) {
    const groups = t.load(`navigation/${file}.ts`)[exportName]
    const items = groups.flatMap(group => group.items)
    assert.equal(new Set(items.map(item => item.path)).size, items.length)
    for (const item of items) {
      const matches = matchRoutes(routes, `${basePath}/${item.path}`)
      assert.equal(matches[1].route.element.props.role, role)
      assert.ok(matches.some(match => match.route.path === basePath))
      assert.equal(matches.at(-1).route.path, item.path)
    }
    assert.equal(matchRoutes(routes, basePath).at(-1).route.index, true)
  }
})
