import { createSlice, isAnyOf, type PayloadAction } from "@reduxjs/toolkit"
import { getPayments, getPaymentDetail, getPaymentOptions, verifyPayment, cancelPayment, exportPaymentRows } from "../action/paymentThunk"
import { logout } from "./authSlice"
import { logoutApi, refreshToken } from "../action/authThunk"
import type { PaymentDetail, PaymentFilters, PaymentList, PaymentOptions } from "@/types/payments"
interface Remote<T> { data: T | null; loading: boolean; error: string | null; requestId: string | null }
const remote = <T>(): Remote<T> => ({ data: null, loading: false, error: null, requestId: null })
const initialState = {
  list: remote<PaymentList>(), detail: remote<PaymentDetail>(), options: remote<PaymentOptions>(),
  mutation: remote<null>(), exporting: remote<null>(),
  filters: { search: "" } as PaymentFilters, page: 1, limit: 10,
}
const slice = createSlice({
  name: "payments", initialState,
  reducers: {
    setPaymentFilters(state, action: PayloadAction<Partial<PaymentFilters>>) { state.filters = { ...state.filters, ...action.payload }; state.page = 1; state.list = remote() },
    setPaymentPage(state, action: PayloadAction<number>) { state.page = Math.max(1, action.payload); state.list = remote() },
    resetPaymentFilters(state) { state.filters = { search: "", academicYearId: state.filters.academicYearId }; state.page = 1; state.list = remote() },
    clearPaymentDetail(state) { state.detail = remote() },
    clearPaymentMutationError(state) { if (!state.mutation.loading) state.mutation = remote() },
  },
  extraReducers: builder => {
    builder.addCase(getPayments.pending, (state, action) => { state.list = { ...remote(), loading: true, requestId: action.meta.requestId } })
      .addCase(getPayments.fulfilled, (state, action) => { if (state.list.requestId !== action.meta.requestId) return; state.list = { ...remote(), data: action.payload }; const lastPage = Math.max(1, action.payload.pagination.totalPages); if (state.page > lastPage) state.page = lastPage })
      .addCase(getPayments.rejected, (state, action) => { if (state.list.requestId !== action.meta.requestId) return; state.list = { ...remote(), error: action.meta.aborted ? null : action.payload ?? "Pembayaran gagal dimuat." } })
      .addCase(getPaymentDetail.pending, (state, action) => { state.detail = { ...remote(), loading: true, requestId: action.meta.requestId } })
      .addCase(getPaymentDetail.fulfilled, (state, action) => { if (state.detail.requestId !== action.meta.requestId) return; state.detail = { ...remote(), data: action.payload } })
      .addCase(getPaymentDetail.rejected, (state, action) => { if (state.detail.requestId !== action.meta.requestId) return; state.detail = { ...remote(), error: action.meta.aborted ? null : action.payload ?? "Detail pembayaran gagal dimuat." } })
      .addCase(getPaymentOptions.pending, (state, action) => { state.options = { ...remote(), loading: true, requestId: action.meta.requestId } })
      .addCase(getPaymentOptions.fulfilled, (state, action) => { if (state.options.requestId !== action.meta.requestId) return; state.options = { ...remote(), data: action.payload } })
      .addCase(getPaymentOptions.rejected, (state, action) => { if (state.options.requestId !== action.meta.requestId) return; state.options = { ...remote(), error: action.meta.aborted ? null : action.payload ?? "Pilihan filter gagal dimuat." } })
      .addCase(exportPaymentRows.pending, (state, action) => { state.exporting = { ...remote(), loading: true, requestId: action.meta.requestId } })
      .addCase(exportPaymentRows.fulfilled, (state, action) => { if (state.exporting.requestId === action.meta.requestId) state.exporting = remote() })
      .addCase(exportPaymentRows.rejected, (state, action) => { if (state.exporting.requestId !== action.meta.requestId) return; state.exporting = { ...remote(), error: action.meta.aborted ? null : action.payload ?? "Export gagal." } })
      .addCase(logout, () => initialState).addCase(logoutApi.fulfilled, () => initialState).addCase(refreshToken.rejected, () => initialState)
      .addMatcher(isAnyOf(verifyPayment.pending, cancelPayment.pending), (state, action) => { state.mutation = { ...remote(), loading: true, requestId: action.meta.requestId } })
      .addMatcher(isAnyOf(verifyPayment.fulfilled, cancelPayment.fulfilled), (state, action) => {
        if (state.mutation.requestId !== action.meta.requestId) return
        state.mutation = remote(); state.detail = remote(); state.list = remote()
      })
      .addMatcher(isAnyOf(verifyPayment.rejected, cancelPayment.rejected), (state, action) => { if (state.mutation.requestId !== action.meta.requestId) return; state.mutation = { ...remote(), error: action.payload ?? "Perubahan pembayaran gagal." } })
  },
})
export const { setPaymentFilters, setPaymentPage, resetPaymentFilters, clearPaymentDetail, clearPaymentMutationError } = slice.actions
export default slice.reducer
