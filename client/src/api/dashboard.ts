import { api } from "@/api/axios"
import type { AcademicYearOption, DashboardData } from "@/types/dashboard"

export async function getDashboard(tahunAkademikId: number | undefined, signal: AbortSignal) {
  const response = await api.get<{ data: DashboardData }>("/admin/dashboard", { params: { tahunAkademikId }, signal })
  return response.data.data
}

export async function getDashboardYears(signal: AbortSignal) {
  const result: AcademicYearOption[] = []
  let page = 1
  let totalPages: number
  do {
    const { data } = await api.get<{ tahunAkademik: AcademicYearOption[]; pagination: { totalPages: number } }>("/tahun-akademik", { signal, params: { page, limit: 100, sortBy: "tahun", sortOrder: "desc" } })
    result.push(...data.tahunAkademik)
    totalPages = data.pagination.totalPages
    page++
  } while (page <= totalPages)
  return result
}
