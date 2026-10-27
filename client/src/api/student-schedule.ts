import { isAxiosError } from "axios"
import { api } from "@/api/axios"
import type { StudentScheduleResponse } from "@/types/student-schedule"

export async function getMySchedule(signal?: AbortSignal) {
  const response = await api.get<{ data: StudentScheduleResponse }>("/student/me/schedule", { signal })
  return response.data.data
}

export function studentScheduleErrorMessage(error: unknown) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? "Jadwal kuliah gagal dimuat."
    : "Jadwal kuliah gagal dimuat."
}
