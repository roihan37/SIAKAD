import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { GradeSummary, StudentGradeItem, CourseGradeItem, StudentGradeDetail, CourseGradeDetail, GradeFilters, GradeStatus, GradeOptions, Pagination } from "@/types/grades"
import { getGradeSummary, getStudentGrades, getCourseGrades, getStudentGradeDetail, getCourseGradeDetail, getGradeOptions } from "../action/gradeThunk"
import { logout } from "./authSlice"
import { logoutApi, refreshToken } from "../action/authThunk"
type Remote<T> = { data: T | null; loading: boolean; error: string | null; requestId: string | null }
const empty = <T>(): Remote<T> => ({ data: null, loading: false, error: null, requestId: null })
const pagination = (): Pagination => ({ page: 1, limit: 10, totalRows: 0, totalPages: 1 })
const initialState = {
  filters: {} as GradeFilters,
  studentPagination: pagination(), coursePagination: pagination(),
  summary: empty<GradeSummary>(),
  studentGrades: empty<StudentGradeItem[]>(),
  courseGrades: empty<CourseGradeItem[]>(),
  studentDetail: empty<StudentGradeDetail>(),
  courseDetail: empty<CourseGradeDetail>(),
  options: empty<GradeOptions>(),
}
function resetPages(state: typeof initialState) {
  state.studentPagination = pagination(); state.coursePagination = pagination()
  state.summary = empty(); state.studentGrades = empty(); state.courseGrades = empty()
  state.studentDetail = empty(); state.courseDetail = empty()
}
const slice = createSlice({ name: "grades", initialState, reducers: {
  setAcademicYearId(state, action: PayloadAction<number | undefined>) { if (state.filters.academicYearId === action.payload) return; state.filters.academicYearId = action.payload; state.filters.classId = undefined; resetPages(state) },
  setStudyProgramId(state, action: PayloadAction<number | undefined>) { if (state.filters.studyProgramId === action.payload) return; state.filters.studyProgramId = action.payload; state.filters.classId = undefined; state.filters.lecturerId = undefined; resetPages(state) },
  setClassId(state, action: PayloadAction<number | undefined>) { if (state.filters.classId === action.payload) return; state.filters.classId = action.payload; resetPages(state) },
  setCourseId(state, action: PayloadAction<number | undefined>) { if (state.filters.courseId === action.payload) return; state.filters.courseId = action.payload; resetPages(state) },
  setLecturerId(state, action: PayloadAction<string | undefined>) { if (state.filters.lecturerId === action.payload) return; state.filters.lecturerId = action.payload; resetPages(state) },
  setStatus(state, action: PayloadAction<GradeStatus | undefined>) { if (state.filters.status === action.payload) return; state.filters.status = action.payload; resetPages(state) },
  setSearch(state, action: PayloadAction<string | undefined>) { if (state.filters.search === action.payload) return; state.filters.search = action.payload; resetPages(state) },
  setStudentPage(state, action: PayloadAction<number>) { if (action.payload < 1 || state.studentPagination.page === action.payload) return; state.studentPagination.page = action.payload; state.studentGrades = empty() },
  setCoursePage(state, action: PayloadAction<number>) { if (action.payload < 1 || state.coursePagination.page === action.payload) return; state.coursePagination.page = action.payload; state.courseGrades = empty() },
  resetFilters(state) { state.filters = { academicYearId: state.filters.academicYearId }; resetPages(state) },
  clearStudentDetail(state) { state.studentDetail = empty() },
  clearCourseDetail(state) { state.courseDetail = empty() },
}, extraReducers(builder) {
  builder
    .addCase(getGradeSummary.pending, (state, action) => { state.summary = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
    .addCase(getGradeSummary.fulfilled, (state, action) => { if (state.summary.requestId !== action.meta.requestId) return; state.summary = { data: action.payload, loading: false, error: null, requestId: null }; })
    .addCase(getGradeSummary.rejected, (state, action) => { if (state.summary.requestId !== action.meta.requestId) return; state.summary = { data: null, loading: false, error: action.meta.aborted ? null : action.payload ?? "Data nilai gagal dimuat.", requestId: null } })
    .addCase(getStudentGrades.pending, (state, action) => { state.studentGrades = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
    .addCase(getStudentGrades.fulfilled, (state, action) => { if (state.studentGrades.requestId !== action.meta.requestId) return; state.studentGrades = { data: action.payload.grades, loading: false, error: null, requestId: null }; state.studentPagination = action.payload.pagination; })
    .addCase(getStudentGrades.rejected, (state, action) => { if (state.studentGrades.requestId !== action.meta.requestId) return; state.studentGrades = { data: null, loading: false, error: action.meta.aborted ? null : action.payload ?? "Data nilai gagal dimuat.", requestId: null } })
    .addCase(getCourseGrades.pending, (state, action) => { state.courseGrades = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
    .addCase(getCourseGrades.fulfilled, (state, action) => { if (state.courseGrades.requestId !== action.meta.requestId) return; state.courseGrades = { data: action.payload.courses, loading: false, error: null, requestId: null }; state.coursePagination = action.payload.pagination; })
    .addCase(getCourseGrades.rejected, (state, action) => { if (state.courseGrades.requestId !== action.meta.requestId) return; state.courseGrades = { data: null, loading: false, error: action.meta.aborted ? null : action.payload ?? "Data nilai gagal dimuat.", requestId: null } })
    .addCase(getStudentGradeDetail.pending, (state, action) => { state.studentDetail = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
    .addCase(getStudentGradeDetail.fulfilled, (state, action) => { if (state.studentDetail.requestId !== action.meta.requestId) return; state.studentDetail = { data: action.payload, loading: false, error: null, requestId: null }; })
    .addCase(getStudentGradeDetail.rejected, (state, action) => { if (state.studentDetail.requestId !== action.meta.requestId) return; state.studentDetail = { data: null, loading: false, error: action.meta.aborted ? null : action.payload ?? "Data nilai gagal dimuat.", requestId: null } })
    .addCase(getCourseGradeDetail.pending, (state, action) => { state.courseDetail = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
    .addCase(getCourseGradeDetail.fulfilled, (state, action) => { if (state.courseDetail.requestId !== action.meta.requestId) return; state.courseDetail = { data: action.payload, loading: false, error: null, requestId: null }; })
    .addCase(getCourseGradeDetail.rejected, (state, action) => { if (state.courseDetail.requestId !== action.meta.requestId) return; state.courseDetail = { data: null, loading: false, error: action.meta.aborted ? null : action.payload ?? "Data nilai gagal dimuat.", requestId: null } })
    .addCase(getGradeOptions.pending, (state, action) => { state.options = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
    .addCase(getGradeOptions.fulfilled, (state, action) => { if (state.options.requestId !== action.meta.requestId) return; state.options = { data: action.payload, loading: false, error: null, requestId: null }; if (!state.filters.academicYearId) { state.filters.academicYearId = Number((action.payload.years.find((year) => year.active) ?? action.payload.years[0])?.id) || undefined; } })
    .addCase(getGradeOptions.rejected, (state, action) => { if (state.options.requestId !== action.meta.requestId) return; state.options = { data: null, loading: false, error: action.meta.aborted ? null : action.payload ?? "Data nilai gagal dimuat.", requestId: null } })
    .addCase(logout, () => initialState).addCase(logoutApi.fulfilled, () => initialState).addCase(refreshToken.rejected, () => initialState)
} })
export const { setAcademicYearId, setStudyProgramId, setClassId, setCourseId, setLecturerId, setStatus, setSearch, setStudentPage, setCoursePage, resetFilters, clearStudentDetail, clearCourseDetail } = slice.actions
export default slice.reducer
