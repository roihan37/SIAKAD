export type StudentAttendanceQuery = { id: string; tahunAkademikId: number }
export type StudentAttendance = {
  academicYear: { id: number; year: string; semester: string }
  summary: { attendancePercentage: number; present: number; permission: number; sick: number; absent: number; totalRecords: number }
  courses: { course: { id: number; code: string; name: string }; meetings: number; attendance: { present: number; permission: number; sick: number; absent: number; percentage: number } }[]
}
