import { createAsyncThunk } from "@reduxjs/toolkit"
import { api } from "@/api/axios"
import { getDashboardYears } from "@/api/dashboard"
import { masterApi, masterError } from "@/components/master-data/master-api"
import type { Payment, PaymentDetail, PaymentFilters, PaymentList, PaymentOptions, PaymentQuery, PaymentStatus } from "@/types/payments"

async function fetchPayments(params: PaymentQuery, signal: AbortSignal) {
  return (await api.get<{ data: PaymentList }>("/admin/payments", { params, signal })).data.data
}
export const getPayments = createAsyncThunk<PaymentList, PaymentQuery, { rejectValue: string }>("payments/list", async (params, { signal, rejectWithValue }) => {
  try { return await fetchPayments(params, signal) }
  catch (error) { return rejectWithValue(masterError(error)) }
})
export const getPaymentDetail = createAsyncThunk<PaymentDetail, string, { rejectValue: string }>("payments/detail", async (id, { signal, rejectWithValue }) => {
  try { return (await api.get<{ data: PaymentDetail }>(`/admin/payments/${encodeURIComponent(id)}`, { signal })).data.data }
  catch (error) { return rejectWithValue(masterError(error)) }
})
type MutationResult = { id: string; status: PaymentStatus }
// These prefixes deliberately use a single UI-managed loading/success/error toast.
export const verifyPayment = createAsyncThunk<MutationResult, { id: string; decision: "APPROVE" | "REJECT"; reason?: string }, { rejectValue: string }>("payments/verify", async ({ id, ...body }, { rejectWithValue }) => {
  try { return (await api.patch<{ data: MutationResult }>(`/admin/payments/${encodeURIComponent(id)}/verify`, body)).data.data }
  catch (error) { return rejectWithValue(masterError(error)) }
})
export const cancelPayment = createAsyncThunk<MutationResult, { id: string; reason: string }, { rejectValue: string }>("payments/cancel", async ({ id, reason }, { rejectWithValue }) => {
  try { return (await api.patch<{ data: MutationResult }>(`/admin/payments/${encodeURIComponent(id)}/cancel`, { reason })).data.data }
  catch (error) { return rejectWithValue(masterError(error)) }
})
export const getPaymentOptions = createAsyncThunk<PaymentOptions, void, { rejectValue: string }>("payments/options", async (_, { signal, rejectWithValue }) => {
  try {
    const [years, programs] = await Promise.all([getDashboardYears(signal), masterApi.options("prodi", signal)])
    return { years: years.map(year => ({ id: String(year.id), label: `${year.tahun} ${year.semester}` })), programs: programs.map(program => ({ id: String(program.id), label: program.name })) }
  } catch (error) { return rejectWithValue(masterError(error)) }
})
export const exportPaymentRows = createAsyncThunk<Payment[], PaymentFilters, { rejectValue: string }>("payments/export", async (filters, { signal, rejectWithValue }) => {
  try {
    const rows: Payment[] = []
    for (let page = 1, totalPages = 1; page <= totalPages; page++) {
      signal.throwIfAborted()
      const result = await fetchPayments({ ...filters, page, limit: 100 }, signal)
      rows.push(...result.payments); totalPages = result.pagination.totalPages
    }
    return rows
  } catch (error) { return rejectWithValue(masterError(error)) }
})
