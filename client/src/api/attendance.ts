import { api } from "./axios"
import type { AttendanceOptions, AttendanceQuery, AttendanceOption, Pagination } from "@/types/attendance"
export async function getAttendance<T>(path: string, params: AttendanceQuery, signal: AbortSignal) {
  return (await api.get<{ data: T }>(`/admin/presensi/${path}`, { params, signal })).data.data
}
export async function getAttendanceOptions(signal: AbortSignal): Promise<AttendanceOptions> {
  const result: AttendanceOptions = { academicYears: [], studyPrograms: [], classes: [], courses: [], lecturers: [] }
  let page = 1, totalPages = 1
  do {
    const data = await getAttendance<Record<keyof AttendanceOptions, { items: AttendanceOption[]; pagination: Pagination }>>("filters", { page, limit: 100 }, signal)
    for (const key of Object.keys(result) as (keyof AttendanceOptions)[]) {
      result[key].push(...data[key].items)
      totalPages = Math.max(totalPages, data[key].pagination.totalPages)
    }
    page++
  } while (page <= totalPages)
  return result
}
