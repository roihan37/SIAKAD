import { isAxiosError } from "axios"

import { api } from "@/api/axios"
import type { StudentPaymentsResponse } from "@/types/student-payments"

export async function getStudentPayments(signal: AbortSignal) {
  const response = await api.get<{ data: StudentPaymentsResponse }>("/student/me/payments", { signal })
  return response.data.data
}

export function studentPaymentsErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}
