import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getPayments, getPaymentDetail, getPaymentOptions, verifyPayment, cancelPayment, exportPaymentRows } from "@/features/action/paymentThunk"
import { clearPaymentDetail, clearPaymentMutationError, setPaymentFilters } from "@/features/slice/paymentSlice"
import type { ReviewDecision } from "@/types/payments"
import { canReview, exportPayments } from "./payment-format"
export type PaymentPanel = { id: string; mode: "detail" | "bill" | "verify" | "cancel" }
export function usePayments() {
  const dispatch = useAppDispatch()
  const state = useAppSelector(root => root.payments)
  const [search, setSearch] = useState(state.filters.search)
  const [panel, setPanel] = useState<PaymentPanel | null>(null)
  const [detailRetry, setDetailRetry] = useState(0)
  const [listRetry, setListRetry] = useState(0)
  const submitting = useRef(false)
  const exportRequest = useRef<ReturnType<ReturnType<typeof exportPaymentRows>> | null>(null)
  const invalidRange = !!state.filters.startDate && !!state.filters.endDate && state.filters.startDate > state.filters.endDate
  useEffect(() => { const request = dispatch(getPaymentOptions()); return () => request.abort() }, [dispatch])
  useEffect(() => {
    const timer = setTimeout(() => { if (search.trim() !== state.filters.search) dispatch(setPaymentFilters({ search: search.trim() })) }, 400)
    return () => clearTimeout(timer)
  }, [dispatch, search, state.filters.search])
  useEffect(() => {
    if (invalidRange) return
    const request = dispatch(getPayments({ ...state.filters, page: state.page, limit: state.limit }))
    return () => request.abort()
  }, [dispatch, state.filters, state.page, state.limit, invalidRange, listRetry])
  useEffect(() => {
    if (!panel) return
    const request = dispatch(getPaymentDetail(panel.id))
    return () => { request.abort(); dispatch(clearPaymentDetail()) }
  }, [dispatch, panel, detailRetry])
  useEffect(() => () => exportRequest.current?.abort(), [])
  const closePanel = () => { if (!submitting.current && !state.mutation.loading) { setPanel(null); dispatch(clearPaymentDetail()) } }
  async function save(decision: ReviewDecision, reason: string) {
    const payment = state.detail.data
    if (submitting.current || !payment || !canReview(payment) || (decision !== "APPROVE" && !reason.trim())) return
    submitting.current = true
    const toastId = toast.loading("Memproses pembayaran...")
    try {
      if (decision === "CANCEL") await dispatch(cancelPayment({ id: payment.id, reason: reason.trim() })).unwrap()
      else await dispatch(verifyPayment({ id: payment.id, decision, ...(reason.trim() ? { reason: reason.trim() } : {}) })).unwrap()
      toast.success(decision === "APPROVE" ? "Pembayaran disetujui." : decision === "REJECT" ? "Pembayaran ditolak." : "Pembayaran dibatalkan.", { id: toastId })
      setPanel(null); setListRetry(value => value + 1)
    } catch (error) {
      toast.error(typeof error === "string" ? error : "Perubahan pembayaran gagal.", { id: toastId })
      // Recheck current status after conflicts while preserving the mutation error.
      setDetailRetry(value => value + 1); setListRetry(value => value + 1)
    } finally { submitting.current = false }
  }
  async function exportAll() {
    if (exportRequest.current || invalidRange) return
    const request = dispatch(exportPaymentRows(state.filters)); exportRequest.current = request
    try { const rows = await request.unwrap(); if (rows.length) { exportPayments(rows); toast.success(`${rows.length} transaksi diexport.`) } else toast.info("Tidak ada transaksi untuk diexport.") }
    catch (error) { if (!(error && typeof error === "object" && "name" in error && error.name === "AbortError")) toast.error(typeof error === "string" ? error : "Export gagal.") }
    finally { exportRequest.current = null }
  }
  return { ...state, search, setSearch, panel, openPanel: (next: PaymentPanel) => { dispatch(clearPaymentMutationError()); dispatch(clearPaymentDetail()); setPanel(next) }, closePanel, invalidRange, save, exportAll, retryList: () => setListRetry(value => value + 1), retryDetail: () => setDetailRetry(value => value + 1), retryOptions: () => dispatch(getPaymentOptions()) }
}
