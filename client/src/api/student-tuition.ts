import { isAxiosError } from "axios"

import { api } from "@/api/axios"
import type { StudentTuitionBills } from "@/types/tuition"

export async function getStudentTuitionBills(signal: AbortSignal) {
  const response = await api.get<{ data: StudentTuitionBills }>("/students/me/ukt", { signal })
  return response.data.data
}

export function studentTuitionErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}
