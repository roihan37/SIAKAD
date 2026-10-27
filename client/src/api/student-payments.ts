import { isAxiosError } from "axios"

import { api } from "@/api/axios"
import type {
  StudentGatewayPayment,
  StudentPayment,
  StudentPaymentsResponse,
} from "@/types/student-payments"

const midtransRedirectHosts = new Set(["app.midtrans.com", "app.sandbox.midtrans.com"])

export async function getStudentPayments(signal: AbortSignal) {
  const response = await api.get<{ data: StudentPaymentsResponse }>("/student/me/payments", { signal })
  return response.data.data
}

export async function createStudentBillPayment(billId: string) {
  const response = await api.post<{ data: StudentGatewayPayment }>(
    `/student/me/bills/${encodeURIComponent(billId)}/pay`,
  )
  return response.data.data
}

export async function refreshStudentPayment(paymentId: string, signal?: AbortSignal) {
  const response = await api.post<{ data: StudentPayment }>(
    `/student/me/payments/${encodeURIComponent(paymentId)}/refresh`,
    undefined,
    { signal },
  )
  return response.data.data
}

export function getMidtransRedirectUrl(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" && midtransRedirectHosts.has(url.hostname)
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export function studentPaymentsErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}
