import { isAxiosError } from "axios"
import { api } from "@/api/axios"
import type { StudentMyAttendanceResponse } from "@/types/student-my-attendance"

export async function getMyAttendance(signal?: AbortSignal) {
  const response = await api.get<{ data: StudentMyAttendanceResponse }>("/student/me/attendance", { signal })
  return response.data.data
}

export function studentAttendanceErrorMessage(error: unknown) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? "Data presensi gagal dimuat."
    : "Data presensi gagal dimuat."
}
