import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { getTuitionBills, getTuitionOptions, generateTuitionBills } from "../action/tuitionThunk"
import { logout } from "./authSlice"
import { logoutApi, refreshToken } from "../action/authThunk"
import type { BillFilters, BillList, BillOptions } from "@/types/tuition"
interface TuitionState {
  data: BillList | null
  filters: BillFilters
  page: number
  limit: number
  loading: boolean
  error: string | null
  requestId: string | null
  options: BillOptions
  optionsLoading: boolean
  optionsError: string | null
  optionsRequestId: string | null
  generating: boolean
  generateRequestId: string | null
  generateError: string | null
}
const initialState: TuitionState = { data: null, filters: { search: "" }, page: 1, limit: 10, loading: false, error: null, requestId: null, options: { years: [], programs: [] }, optionsLoading: false, optionsError: null, optionsRequestId: null, generating: false, generateRequestId: null, generateError: null }
const slice = createSlice({
  name: "tuition", initialState,
  reducers: {
    setBillFilters(state, action: PayloadAction<Partial<BillFilters>>) { state.filters = { ...state.filters, ...action.payload }; state.page = 1; state.requestId = null; state.data = null; state.error = null },
    setBillPage(state, action: PayloadAction<number>) { state.page = action.payload; state.requestId = null; state.data = null; state.error = null },
    resetBillFilters(state) { state.filters = { search: "", tahunAkademikId: state.filters.tahunAkademikId }; state.page = 1; state.requestId = null; state.data = null; state.error = null },
    clearGenerateError(state) { state.generateError = null },
  },
  extraReducers: builder => {
    builder.addCase(getTuitionBills.pending, (state, action) => { state.loading = true; state.error = null; state.data = null; state.requestId = action.meta.requestId })
      .addCase(getTuitionBills.fulfilled, (state, action) => { if (state.requestId !== action.meta.requestId) return; state.data = action.payload; state.loading = false })
      .addCase(getTuitionBills.rejected, (state, action) => { if (state.requestId !== action.meta.requestId) return; state.loading = false; state.error = action.meta.aborted ? null : action.payload ?? "Tagihan gagal dimuat." })
      .addCase(getTuitionOptions.pending, (state, action) => { state.optionsLoading = true; state.optionsError = null; state.optionsRequestId = action.meta.requestId })
      .addCase(getTuitionOptions.fulfilled, (state, action) => { if (state.optionsRequestId !== action.meta.requestId) return; state.options = action.payload; state.optionsLoading = false })
      .addCase(getTuitionOptions.rejected, (state, action) => { if (state.optionsRequestId !== action.meta.requestId) return; state.optionsLoading = false; state.optionsError = action.meta.aborted ? null : action.payload ?? "Pilihan filter gagal dimuat." })
      .addCase(generateTuitionBills.pending, (state, action) => { state.generating = true; state.generateError = null; state.generateRequestId = action.meta.requestId })
      .addCase(generateTuitionBills.fulfilled, (state, action) => { if (state.generateRequestId !== action.meta.requestId) return; state.generating = false; state.generateRequestId = null })
      .addCase(generateTuitionBills.rejected, (state, action) => { if (state.generateRequestId !== action.meta.requestId) return; state.generating = false; state.generateRequestId = null; state.generateError = action.payload ?? "Generate tagihan gagal." })
      .addCase(logout, () => initialState).addCase(logoutApi.fulfilled, () => initialState).addCase(refreshToken.rejected, () => initialState)
  },
})
export const { setBillFilters, setBillPage, resetBillFilters, clearGenerateError } = slice.actions
export default slice.reducer
