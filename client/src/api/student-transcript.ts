import { isAxiosError } from "axios"

import { api } from "@/api/axios"
import type { StudentTranscript } from "@/types/student-transcript"

export async function getStudentTranscript(signal: AbortSignal): Promise<StudentTranscript> {
  const response = await api.get<{ data: StudentTranscript }>("/student/me/transcript", { signal })
  return response.data.data
}

export function studentTranscriptErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}
