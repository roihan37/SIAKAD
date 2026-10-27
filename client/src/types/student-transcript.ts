import type { StudentGradeCourse, StudentGradeSemester } from "@/types/student-grades"

export interface StudentTranscriptSemester {
  id: number
  semesterNumber: number
  academicYear: {
    id: number
    tahun: string
    semester: StudentGradeSemester
    label: string
  }
  semesterGpa: number
  totalCredits: number
  courses: StudentGradeCourse[]
}

export interface StudentTranscript {
  cumulativeGpa: number
  completedCredits: number
  semesters: StudentTranscriptSemester[]
}
