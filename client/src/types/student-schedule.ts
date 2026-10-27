export type StudentScheduleDay = "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU"

export interface StudentScheduleItem {
  id: number
  kelasMataKuliahId: number
  day: StudentScheduleDay
  dayOrder: number | null
  startTime: string
  endTime: string
  course: { id: number; code: string; name: string; credits: number }
  class: { id: number; name: string }
  lecturer: { id: string; name: string }
  room: { id: number; code: string; name: string; building: string | null }
}

export interface StudentScheduleResponse {
  academicYear: { id: number; year: string; semester: "GANJIL" | "GENAP"; isActive: boolean }
  krsStatus: "DRAFT" | "DIAJUKAN" | "DISETUJUI" | "DITOLAK" | null
  schedules: StudentScheduleItem[]
}
