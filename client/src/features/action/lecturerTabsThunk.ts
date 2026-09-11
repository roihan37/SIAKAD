import { createAsyncThunk } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import { api } from "@/api/axios"
import type { AcademicYear, AdviseeParams, AdviseesData, LecturerTabParams, ScheduleData, TeachingData } from "@/types/lecturer-tabs"

function errorMessage(error: unknown) {
  return isAxiosError<{ message?: string }>(error)
    ? error.response?.data?.message ?? "Data gagal dimuat. Silakan coba lagi."
    : "Data gagal dimuat. Silakan coba lagi."
}

function createTabRequest<T, P extends LecturerTabParams>(endpoint: string) {
  return createAsyncThunk<T, P, { rejectValue: string }>(`lecturerTabs/${endpoint}`, async ({ id, ...params }, { signal, rejectWithValue }) => {
    try {
      const response = await api.get<{ data: T }>(`/lecturers/${encodeURIComponent(id)}/${endpoint}`, { params, signal })
      return response.data.data
    } catch (error) { return rejectWithValue(errorMessage(error)) }
  })
}

export const getLecturerTeach = createTabRequest<TeachingData, LecturerTabParams>("teach")
export const getLecturerSchedule = createTabRequest<ScheduleData, LecturerTabParams>("schedule")
export const getLecturerAdvisees = createTabRequest<AdviseesData, AdviseeParams>("advisees")
export const getLecturerAcademicYears = createAsyncThunk<AcademicYear[], undefined, { rejectValue: string }>("lecturerTabs/years", async (_, { signal, rejectWithValue }) => {
  try {
    const years: AcademicYear[] = []
    let page = 1
    let totalPages = 1
    do {
      const response = await api.get<{ tahunAkademik: AcademicYear[]; pagination: { totalPages: number } }>("/tahun-akademik", { params: { page, limit: 100, sortBy: "tahun", sortOrder: "desc" }, signal })
      years.push(...response.data.tahunAkademik)
      totalPages = response.data.pagination.totalPages
      page += 1
    } while (page <= totalPages)
    return years
  } catch (error) { return rejectWithValue(errorMessage(error)) }
})
