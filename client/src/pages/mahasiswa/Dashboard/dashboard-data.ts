export type ScheduleStatus = "Selesai" | "Berlangsung" | "Berikutnya"

export interface StudentDashboardData {
  student: {
    name: string
    studyProgram: string
    semester: number
    academicYear: string
  }
  summary: {
    gpa: string
    completedCredits: number
    attendance: number
  }
  todaySchedule: Array<{
    id: number
    time: string
    course: string
    code: string
    lecturer: string
    room: string
    status: ScheduleStatus
  }>
  academicStatus: {
    studyPlan: { status: string; credits: number }
    tuition: { status: string; period: string }
  }
  announcements: Array<{
    id: number
    category: string
    title: string
    date: string
  }>
  attendanceByCourse: Array<{
    id: number
    course: string
    attended: number
    meetings: number
  }>
}

export const studentDashboardData: StudentDashboardData = {
  student: {
    name: "Nadia Putri Ramadhani",
    studyProgram: "Teknik Informatika",
    semester: 6,
    academicYear: "2025/2026 Genap",
  },
  summary: {
    gpa: "3,78",
    completedCredits: 104,
    attendance: 94,
  },
  todaySchedule: [
    {
      id: 1,
      time: "08.00–09.40",
      course: "Rekayasa Perangkat Lunak",
      code: "IF601",
      lecturer: "Dr. Rina Puspitasari, M.Kom.",
      room: "Lab Komputasi 2",
      status: "Selesai",
    },
    {
      id: 2,
      time: "10.00–11.40",
      course: "Kecerdasan Buatan",
      code: "IF603",
      lecturer: "Andi Wijaya, M.Kom.",
      room: "Gedung B · B-204",
      status: "Berlangsung",
    },
    {
      id: 3,
      time: "13.00–14.40",
      course: "Keamanan Informasi",
      code: "IF605",
      lecturer: "Fajar Hidayat, M.Cs.",
      room: "Gedung A · A-302",
      status: "Berikutnya",
    },
  ],
  academicStatus: {
    studyPlan: { status: "Disetujui", credits: 21 },
    tuition: { status: "Lunas", period: "Semester Genap" },
  },
  announcements: [
    { id: 1, category: "Akademik", title: "Jadwal Ujian Tengah Semester Genap", date: "12 Maret 2026" },
    { id: 2, category: "Kemahasiswaan", title: "Pendaftaran Program Kreativitas Mahasiswa", date: "10 Maret 2026" },
    { id: 3, category: "Perpustakaan", title: "Perpanjangan Jam Layanan Menjelang UTS", date: "8 Maret 2026" },
  ],
  attendanceByCourse: [
    { id: 1, course: "Rekayasa Perangkat Lunak", attended: 11, meetings: 12 },
    { id: 2, course: "Kecerdasan Buatan", attended: 12, meetings: 12 },
    { id: 3, course: "Keamanan Informasi", attended: 10, meetings: 11 },
    { id: 4, course: "Manajemen Proyek TI", attended: 9, meetings: 10 },
  ],
}
