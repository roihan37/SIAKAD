import { createSlice } from "@reduxjs/toolkit"
import type { AcademicYear, AdviseesData, RemoteData, ScheduleData, TeachingData } from "@/types/lecturer-tabs"
import { getLecturerTeach, getLecturerSchedule, getLecturerAdvisees, getLecturerAcademicYears } from "../action/lecturerTabsThunk"

const empty = <T>(): RemoteData<T> => ({ data: null, loading: false, error: null, requestId: null })
const initialState = {
  teach: empty<TeachingData>(),
  schedule: empty<ScheduleData>(),
  advisees: empty<AdviseesData>(),
  years: empty<AcademicYear[]>(),
}
const lecturerTabsSlice = createSlice({
  name: "lecturerTabs",
  initialState,
  reducers: {
    clearTeach: (state) => { state.teach = empty<TeachingData>() },
    clearSchedule: (state) => { state.schedule = empty<ScheduleData>() },
    clearAdvisees: (state) => { state.advisees = empty<AdviseesData>() },
    clearYears: (state) => { state.years = empty<AcademicYear[]>() },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLecturerTeach.pending, (state, action) => {
        state.teach = { data: null, loading: true, error: null, requestId: action.meta.requestId }
      })
      .addCase(getLecturerTeach.fulfilled, (state, action) => {
        if (state.teach.requestId !== action.meta.requestId) return
        state.teach.data = action.payload
        state.teach.loading = false
      })
      .addCase(getLecturerTeach.rejected, (state, action) => {
        if (state.teach.requestId !== action.meta.requestId) return
        state.teach.loading = false
        if (!action.meta.aborted) state.teach.error = action.payload ?? "Data gagal dimuat."
      })
      .addCase(getLecturerSchedule.pending, (state, action) => {
        state.schedule = { data: null, loading: true, error: null, requestId: action.meta.requestId }
      })
      .addCase(getLecturerSchedule.fulfilled, (state, action) => {
        if (state.schedule.requestId !== action.meta.requestId) return
        state.schedule.data = action.payload
        state.schedule.loading = false
      })
      .addCase(getLecturerSchedule.rejected, (state, action) => {
        if (state.schedule.requestId !== action.meta.requestId) return
        state.schedule.loading = false
        if (!action.meta.aborted) state.schedule.error = action.payload ?? "Data gagal dimuat."
      })
      .addCase(getLecturerAdvisees.pending, (state, action) => {
        state.advisees = { data: null, loading: true, error: null, requestId: action.meta.requestId }
      })
      .addCase(getLecturerAdvisees.fulfilled, (state, action) => {
        if (state.advisees.requestId !== action.meta.requestId) return
        state.advisees.data = action.payload
        state.advisees.loading = false
      })
      .addCase(getLecturerAdvisees.rejected, (state, action) => {
        if (state.advisees.requestId !== action.meta.requestId) return
        state.advisees.loading = false
        if (!action.meta.aborted) state.advisees.error = action.payload ?? "Data gagal dimuat."
      })
      .addCase(getLecturerAcademicYears.pending, (state, action) => {
        state.years = { data: null, loading: true, error: null, requestId: action.meta.requestId }
      })
      .addCase(getLecturerAcademicYears.fulfilled, (state, action) => {
        if (state.years.requestId !== action.meta.requestId) return
        state.years.data = action.payload
        state.years.loading = false
      })
      .addCase(getLecturerAcademicYears.rejected, (state, action) => {
        if (state.years.requestId !== action.meta.requestId) return
        state.years.loading = false
        if (!action.meta.aborted) state.years.error = action.payload ?? "Data gagal dimuat."
      })
  },
})
export const { clearTeach, clearSchedule, clearAdvisees, clearYears } = lecturerTabsSlice.actions
export default lecturerTabsSlice.reducer
