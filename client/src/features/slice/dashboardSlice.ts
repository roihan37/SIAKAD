import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { AcademicYearOption, DashboardData } from "@/types/dashboard"
import { fetchDashboard, fetchDashboardYears } from "@/features/action/dashboardThunk"
import { logout } from "@/features/slice/authSlice"
import { logoutApi, refreshToken } from "@/features/action/authThunk"

type RemoteData<T> = { data: T | null; loading: boolean; error: string | null; requestId: string | null }
const empty = <T>(): RemoteData<T> => ({ data: null, loading: false, error: null, requestId: null })
const initialState = {
  overview: empty<DashboardData>(),
  years: empty<AcademicYearOption[]>(),
  selectedYear: undefined as number | undefined,
  revision: 0,
  yearsRevision: 0,
}

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    selectDashboardYear(state, action: PayloadAction<number>) {
      if (!Number.isSafeInteger(action.payload) || action.payload <= 0 || action.payload === (state.selectedYear ?? state.overview.data?.academicYear.id)) return
      state.selectedYear = action.payload
      // Invalidate immediately so an older response cannot win before the effect runs.
      state.overview = { ...empty<DashboardData>(), loading: true }
    },
    reloadDashboard(state) {
      state.selectedYear ??= state.overview.data?.academicYear.id
      state.overview = { ...empty<DashboardData>(), loading: true }
      state.revision++
    },
    reloadDashboardYears(state) { state.yearsRevision++ },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboard.pending, (state, action) => {
        state.overview = { data: null, loading: true, error: null, requestId: action.meta.requestId }
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        if (state.overview.requestId !== action.meta.requestId) return
        state.overview = { data: action.payload, loading: false, error: null, requestId: null }
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        if (state.overview.requestId !== action.meta.requestId) return
        state.overview = { data: null, loading: false, requestId: null, error: action.meta.aborted ? null : action.payload ?? "Dashboard gagal dimuat." }
      })
      .addCase(fetchDashboardYears.pending, (state, action) => {
        state.years.loading = true
        state.years.error = null
        state.years.requestId = action.meta.requestId
      })
      .addCase(fetchDashboardYears.fulfilled, (state, action) => {
        if (state.years.requestId !== action.meta.requestId) return
        state.years = { data: action.payload, loading: false, error: null, requestId: null }
      })
      .addCase(fetchDashboardYears.rejected, (state, action) => {
        if (state.years.requestId !== action.meta.requestId) return
        state.years.loading = false
        state.years.requestId = null
        state.years.error = action.meta.aborted ? null : action.payload ?? "Daftar tahun akademik gagal dimuat."
      })
      .addCase(logout, () => initialState)
      .addCase(logoutApi.fulfilled, () => initialState)
      .addCase(refreshToken.rejected, () => initialState)
  },
})
export const { selectDashboardYear, reloadDashboard, reloadDashboardYears } = dashboardSlice.actions
export default dashboardSlice.reducer
