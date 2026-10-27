export type StudentAttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPHA"

export interface StudentAttendanceRecord {
  id: string
  meetingId: string
  meetingNumber: number
  date: string
  topic: string | null
  status: StudentAttendanceStatus
  note: string | null
}

export interface StudentAttendanceCourse {
  kelasMataKuliahId: number
  course: { id: number; code: string; name: string; credits: number }
  class: { id: number; name: string }
  lecturer: { id: string; name: string }
  records: StudentAttendanceRecord[]
  attendance: {
    present: number
    permission: number
    sick: number
    absent: number
    totalRecords: number
    percentage: number
  }
}

export interface StudentMyAttendanceResponse {
  academicYear: { id: number; year: string; semester: "GANJIL" | "GENAP"; isActive: boolean }
  krsStatus: "DRAFT" | "DIAJUKAN" | "DISETUJUI" | "DITOLAK" | null
  summary: {
    attendancePercentage: number
    present: number
    permission: number
    sick: number
    absent: number
    totalRecords: number
  }
  courses: StudentAttendanceCourse[]
}
