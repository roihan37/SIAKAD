import { isAxiosError } from "axios"

import { api } from "@/api/axios"
import type { StudentDashboard } from "@/types/student-dashboard"

export async function getStudentDashboard(signal: AbortSignal) {
  const response = await api.get<{ data: StudentDashboard }>("/student/me/dashboard", { signal })
  return response.data.data
}

export function studentDashboardErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}
