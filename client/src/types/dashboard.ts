export type AcademicYearOption = { id: number; tahun: string; semester: string }
export type DashboardData = {
  academicYear: { id: number; year: string; semester: string }
  summary: {
    students: { total: number; active: number }
    lecturers: { total: number; active: number }
    studyPrograms: { total: number; faculties: number }
    activeClasses: number
  }
  krs: { percentage: number; submitted: number; notSubmitted: number; pendingApproval: number; categories: Record<"BELUM_KRS" | "DRAFT" | "DIAJUKAN" | "DISETUJUI" | "DITOLAK", number> }
  attention: { studentsWithoutKrs: number; overdueTuition: number | null; classesWithoutLecturer: number; scheduleConflicts: number }
  todaySchedules: {
    id: number; startTime: string; endTime: string
    course: { id: number; code: string; name: string }
    class: { id: number; name: string }
    lecturer: { id: string; name: string }
    room: { id: number; name: string }
  }[]
  tuition: { percentage: number | null; paidAmount: number | null; unpaidAmount: number | null }
  // The server currently returns an empty array; no activity model exists yet.
  recentActivities: unknown[]
}

