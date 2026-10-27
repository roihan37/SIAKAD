import type { StudentAttendanceCourse } from "@/types/student-my-attendance"
import type { StudentScheduleItem } from "@/types/student-schedule"
import type { StudentTuitionBill } from "@/types/tuition"

export interface StudentDashboard {
  student: {
    name: string
    studyProgram: { id: number; code: string; name: string }
    semester: number
    status: string
  }
  academicYear: { id: number; year: string; semester: "GANJIL" | "GENAP"; isActive: boolean }
  summary: { cumulativeGpa: number; completedCredits: number; attendancePercentage: number }
  krs: { status: "DRAFT" | "DIAJUKAN" | "DISETUJUI" | "DITOLAK" | null; selectedCredits: number }
  schedules: StudentScheduleItem[]
  attendanceCourses: StudentAttendanceCourse[]
  tuition: StudentTuitionBill | null
}
