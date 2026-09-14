import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { StudentAttendance, StudentAttendanceQuery } from "@/types/student-attendance"
import { getStudentAttendance } from "../action/studentAttendanceThunk"
import { logout } from "./authSlice"
import { logoutApi, refreshToken } from "../action/authThunk"
const initialState = {
  data: null as StudentAttendance | null,
  loading: false,
  error: null as string | null,
  requestId: null as string | null,
  query: null as StudentAttendanceQuery | null,
  selectedYearId: undefined as number | undefined,
}
const slice = createSlice({
  name: "studentAttendance", initialState,
  reducers: {
    setStudentAttendanceYear(state, action: PayloadAction<number>) {
      if (state.selectedYearId === action.payload || !Number.isSafeInteger(action.payload) || action.payload <= 0) return
      state.selectedYearId = action.payload; state.data = null; state.error = null; state.requestId = null; state.loading = true
    },
    clearStudentAttendance: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStudentAttendance.pending, (state, action) => {
        state.data = null; state.loading = true; state.error = null; state.query = action.meta.arg; state.requestId = action.meta.requestId
      })
      .addCase(getStudentAttendance.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return
        state.data = action.payload; state.loading = false; state.requestId = null
      })
      .addCase(getStudentAttendance.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return
        state.loading = false; state.requestId = null; state.error = action.meta.aborted ? null : action.payload ?? "Presensi mahasiswa gagal dimuat."
      })
      .addCase(logout, () => initialState)
      .addCase(logoutApi.fulfilled, () => initialState)
      .addCase(refreshToken.rejected, () => initialState)
  },
})
export const { setStudentAttendanceYear, clearStudentAttendance } = slice.actions
export default slice.reducer
