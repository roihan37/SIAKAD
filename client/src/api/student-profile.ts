import { isAxiosError } from "axios"

import { api } from "@/api/axios"
import type { StudentProfileData, StudentProfileUpdate } from "@/types/student-profile"

export async function getStudentProfile(signal: AbortSignal) {
  const response = await api.get<{ data: StudentProfileData }>("/student/me/profile", { signal })
  return response.data.data
}

export async function updateStudentProfile(input: StudentProfileUpdate) {
  const response = await api.patch<{ data: StudentProfileData }>("/student/me/profile", input)
  return response.data.data
}

export async function changeStudentPassword(input: { currentPassword: string; newPassword: string }) {
  const response = await api.patch<{ data: { message: string } }>("/student/me/change-password", input)
  return response.data.data
}

export function studentProfileErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}
