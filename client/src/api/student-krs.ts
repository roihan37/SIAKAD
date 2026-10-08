import { isAxiosError } from "axios"
import { api } from "@/api/axios"
import type { StudentKrsData } from "@/types/student-krs"

export async function getStudentKrs(signal: AbortSignal) {
  const response = await api.get<{ data: StudentKrsData }>("/student/me/krs", { signal })
  return response.data.data
}

export async function saveStudentKrsDraft(kelasMataKuliahIds: number[]) {
  const response = await api.put<{ data: StudentKrsData }>("/student/me/krs/draft", { kelasMataKuliahIds })
  return response.data.data
}

export async function submitStudentKrs() {
  const response = await api.post<{ data: StudentKrsData }>("/student/me/krs/submit")
  return response.data.data
}

export function studentKrsErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}
