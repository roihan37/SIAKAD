import { isAxiosError } from "axios"

import { api } from "@/api/axios"
import type {
  StudentGradeAcademicYear,
  StudentGradeResponse,
} from "@/types/student-grades"

interface AcademicYearPage {
  tahunAkademik: StudentGradeAcademicYear[]
  pagination: {
    totalPages: number
  }
}

export async function getStudentGradeAcademicYears(signal: AbortSignal) {
  const years: StudentGradeAcademicYear[] = []
  let page = 1

  while (true) {
    const response = await api.get<AcademicYearPage>("/tahun-akademik", {
      signal,
      params: { page, limit: 100, sortOrder: "desc" },
    })

    years.push(...response.data.tahunAkademik)
    if (page >= response.data.pagination.totalPages) break
    page += 1
  }

  return years
}

export async function getStudentGrades(
  academicYearId: number,
  signal: AbortSignal,
) {
  const response = await api.get<{ data: StudentGradeResponse }>("/student/me/grades", {
    signal,
    params: { tahunAkademikId: academicYearId },
  })

  return response.data.data
}

export function studentGradesErrorMessage(error: unknown, fallback: string) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? fallback
    : fallback
}
