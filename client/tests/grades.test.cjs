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
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 } }).outputText, {
    exports, require: (name) => {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`)
      return dependencies[name]
    },
  })
  return exports
}
function setup(get) {
  const master = { getAllTAkademik: () => {}, getAllProdi: () => {}, getAllMatkul: () => {}, getAllLecturers: () => {} }
  const thunks = load('features/action/gradeThunk.ts', {
    '@reduxjs/toolkit': rtk, axios: { isAxiosError: (error) => error?.isAxiosError === true },
    '@/api/axios': { api: { get } }, './tAkademikThunk': master, './campusThunk': master, './matkulThunk': master, './dosenThunk': master,
  })
  const logout = rtk.createAction('auth/logout')
  const auth = { logoutApi: rtk.createAsyncThunk('auth/logout', async () => {}), refreshToken: rtk.createAsyncThunk('auth/refresh', async () => {}) }
  const slice = load('features/slice/gradeSlice.ts', { '@reduxjs/toolkit': rtk, '../action/gradeThunk': thunks, './authSlice': { logout }, '../action/authThunk': auth })
  return { thunks, slice, logout, store: rtk.configureStore({ reducer: slice.default }) }
}
const pagination = { page: 1, limit: 10, totalRows: 0, totalPages: 0 }
test('all five endpoint paths, query params and detail identifiers match the contract', async () => {
  const calls = []
  const { store, thunks } = setup(async (url, config) => {
    calls.push({ url, config })
    return { data: { data: url.endsWith('/courses') ? { courses: [], pagination } : url.endsWith('/students') ? { grades: [], pagination } : {} } }
  })
  const query = { academicYearId: 3, studyProgramId: 2, classId: 4, courseId: 8, lecturerId: 'lecturer-profile', status: 'FINAL', search: 'Andi', page: 2, limit: 10 }
  await store.dispatch(thunks.getGradeSummary(query)).unwrap()
  await store.dispatch(thunks.getStudentGrades(query)).unwrap()
  await store.dispatch(thunks.getCourseGrades(query)).unwrap()
  await store.dispatch(thunks.getCourseGradeDetail({ kelasMataKuliahId: 99, academicYearId: 3 })).unwrap()
  await store.dispatch(thunks.getStudentGradeDetail({ studentId: 'user/id', kelasMataKuliahId: 99 })).unwrap()
  assert.deepEqual(calls.map((call) => call.url), ['/admin/grades/summary', '/admin/grades/students', '/admin/grades/courses', '/admin/grades/courses/99/students', '/admin/grades/students/user%2Fid/courses/99'])
  assert.equal(calls[1].config.params, query)
  assert.equal(calls[3].config.params.academicYearId, 3)
  assert.ok(calls.every((call) => call.config.signal instanceof AbortSignal))
})
test('filter changes reset both pages, preserve other filters, and invalidate stale responses', () => {
  const { store, slice, thunks } = setup(() => {})
  store.dispatch(slice.setAcademicYearId(3))
  store.dispatch(slice.setStudentPage(4)); store.dispatch(slice.setCoursePage(2))
  store.dispatch(thunks.getStudentGrades.pending('old', { academicYearId: 3 }))
  store.dispatch(slice.setStatus('FINAL'))
  store.dispatch(thunks.getStudentGrades.fulfilled({ grades: [{ krsDetailId: 'stale' }], pagination }, 'old', {}))
  assert.equal(store.getState().studentGrades.data, null)
  assert.equal(store.getState().studentPagination.page, 1)
  assert.equal(store.getState().coursePagination.page, 1)
  assert.equal(store.getState().filters.academicYearId, 3)
  assert.equal(store.getState().filters.status, 'FINAL')
})
test('pagination leaves summary and filters unchanged; reset clears optional filters', () => {
  const { store, slice, thunks } = setup(() => {})
  store.dispatch(slice.setAcademicYearId(3))
  store.dispatch(thunks.getGradeSummary.pending('summary', {}))
  store.dispatch(thunks.getGradeSummary.fulfilled({ totalStudents: 5, averageFinalScore: null }, 'summary', {}))
  const before = store.getState()
  store.dispatch(slice.setCoursePage(2))
  assert.equal(store.getState().summary, before.summary)
  assert.equal(store.getState().filters, before.filters)
  store.dispatch(slice.setSearch('Andi')); store.dispatch(slice.resetFilters())
  assert.equal(store.getState().filters.search, undefined)
  assert.equal(store.getState().filters.academicYearId, 3)
})
test('detail close ignores in-flight responses and logout clears data', () => {
  const { store, slice, thunks, logout } = setup(() => {})
  store.dispatch(thunks.getStudentGradeDetail.pending('detail', {}))
  store.dispatch(slice.clearStudentDetail())
  store.dispatch(thunks.getStudentGradeDetail.fulfilled({ finalScore: 0 }, 'detail', {}))
  assert.equal(store.getState().studentDetail.data, null)
  store.dispatch(slice.setAcademicYearId(3)); store.dispatch(logout())
  assert.equal(store.getState().filters.academicYearId, undefined)
})
test('server errors use rejectWithValue; cancellation does not show an error', async () => {
  const { store, thunks } = setup(async () => { throw { isAxiosError: true, response: { data: { message: 'Academic year not found.' } } } })
  const result = await store.dispatch(thunks.getGradeSummary({ academicYearId: 3 }))
  assert.equal(result.payload, 'Academic year not found.')
  assert.equal(store.getState().summary.error, 'Academic year not found.')
  store.dispatch(thunks.getGradeSummary.pending('abort', {}))
  store.dispatch(thunks.getGradeSummary.rejected({ name: 'AbortError' }, 'abort', {}))
  assert.equal(store.getState().summary.error, null)
})
test('formatting keeps null distinct from a zero score', () => {
  const { score, statusLabels } = load('pages/Nilai/grade-format.ts', {})
  assert.equal(score(null), '—'); assert.equal(score(0), '0')
  assert.equal(statusLabels.FINAL, 'Final')
})
