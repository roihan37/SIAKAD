import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { logout } from "./authSlice"
import { logoutApi, refreshToken } from "../action/authThunk"
import type { AttendanceQuery, AttendanceSummary, StudentAttendancePage, MeetingAttendancePage, AttendanceOptions, MeetingAttendanceDetail } from "@/types/attendance"
import { fetchAttendanceSummary, fetchAttendanceStudents, fetchAttendanceMeetings, fetchAttendanceFilters, fetchAttendanceDetail } from "../action/attendanceThunk"
type Remote<T> = { data: T | null; loading: boolean; error: string | null; requestId: string | null }
const empty = <T>(): Remote<T> => ({ data: null, loading: false, error: null, requestId: null })
const initialState = {
  query: {} as AttendanceQuery,
  page: 1,
  view: "students" as "students" | "meetings",
  summary: empty<AttendanceSummary>(),
  students: empty<StudentAttendancePage>(),
  meetings: empty<MeetingAttendancePage>(),
  filters: empty<AttendanceOptions>(),
  detail: empty<MeetingAttendanceDetail>(),
}
const slice = createSlice({
  name: "attendance", initialState,
  reducers: {
    setAttendanceQuery(state, action: PayloadAction<AttendanceQuery>) { state.query = action.payload; state.page = 1; state.summary = { ...empty(), loading: true }; state.students = { ...empty(), loading: true }; state.meetings = { ...empty(), loading: true } },
    setAttendancePage(state, action: PayloadAction<number>) { if (state.page === action.payload || !Number.isSafeInteger(action.payload) || action.payload < 1) return; state.page = action.payload; state.students = { ...empty(), loading: true }; state.meetings = { ...empty(), loading: true } },
    setAttendanceView(state, action: PayloadAction<"students" | "meetings">) { if (state.view === action.payload) return; state.view = action.payload; state.page = 1; state.students = { ...empty(), loading: true }; state.meetings = { ...empty(), loading: true } },
    clearAttendanceDetail(state) { state.detail = empty() },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAttendanceSummary.pending, (state, action) => { state.summary = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
      .addCase(fetchAttendanceSummary.fulfilled, (state, action) => { if (state.summary.requestId !== action.meta.requestId) return; state.summary = { data: action.payload, loading: false, error: null, requestId: null } })
      .addCase(fetchAttendanceSummary.rejected, (state, action) => { if (state.summary.requestId !== action.meta.requestId) return; state.summary = { data: null, loading: false, error: action.meta.aborted ? null : String(action.payload ?? "Data gagal dimuat."), requestId: null } })
      .addCase(fetchAttendanceStudents.pending, (state, action) => { state.students = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
      .addCase(fetchAttendanceStudents.fulfilled, (state, action) => { if (state.students.requestId !== action.meta.requestId) return; state.students = { data: action.payload, loading: false, error: null, requestId: null } })
      .addCase(fetchAttendanceStudents.rejected, (state, action) => { if (state.students.requestId !== action.meta.requestId) return; state.students = { data: null, loading: false, error: action.meta.aborted ? null : String(action.payload ?? "Data gagal dimuat."), requestId: null } })
      .addCase(fetchAttendanceMeetings.pending, (state, action) => { state.meetings = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
      .addCase(fetchAttendanceMeetings.fulfilled, (state, action) => { if (state.meetings.requestId !== action.meta.requestId) return; state.meetings = { data: action.payload, loading: false, error: null, requestId: null } })
      .addCase(fetchAttendanceMeetings.rejected, (state, action) => { if (state.meetings.requestId !== action.meta.requestId) return; state.meetings = { data: null, loading: false, error: action.meta.aborted ? null : String(action.payload ?? "Data gagal dimuat."), requestId: null } })
      .addCase(fetchAttendanceFilters.pending, (state, action) => { state.filters = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
      .addCase(fetchAttendanceFilters.fulfilled, (state, action) => { if (state.filters.requestId !== action.meta.requestId) return; state.filters = { data: action.payload, loading: false, error: null, requestId: null } })
      .addCase(fetchAttendanceFilters.rejected, (state, action) => { if (state.filters.requestId !== action.meta.requestId) return; state.filters = { data: null, loading: false, error: action.meta.aborted ? null : String(action.payload ?? "Data gagal dimuat."), requestId: null } })
      .addCase(fetchAttendanceDetail.pending, (state, action) => { state.detail = { data: null, loading: true, error: null, requestId: action.meta.requestId } })
      .addCase(fetchAttendanceDetail.fulfilled, (state, action) => { if (state.detail.requestId !== action.meta.requestId) return; state.detail = { data: action.payload, loading: false, error: null, requestId: null } })
      .addCase(fetchAttendanceDetail.rejected, (state, action) => { if (state.detail.requestId !== action.meta.requestId) return; state.detail = { data: null, loading: false, error: action.meta.aborted ? null : String(action.payload ?? "Data gagal dimuat."), requestId: null } })
      .addCase(logout, () => initialState)
      .addCase(logoutApi.fulfilled, () => initialState)
      .addCase(refreshToken.rejected, () => initialState)
  },
})
export const { setAttendanceQuery, setAttendancePage, setAttendanceView, clearAttendanceDetail } = slice.actions
export default slice.reducer
