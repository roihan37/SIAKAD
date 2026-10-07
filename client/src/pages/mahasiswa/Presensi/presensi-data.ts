export type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpa"

export type AttendanceMeeting = {
  id: string
  date: string
  topic: string
  status: AttendanceStatus
}

export type AttendanceCourse = {
  id: string
  code: string
  name: string
  credits: number
  lecturer: string
  className: string
  meetings: AttendanceMeeting[]
}

export const attendanceProfile = {
  academicYear: "2025/2026",
  semester: "Genap",
  minimumAttendance: 75,
}

export const attendanceCourses: AttendanceCourse[] = [
  {
    id: "attendance-01",
    code: "IF302",
    name: "Rekayasa Perangkat Lunak",
    credits: 3,
    lecturer: "Dr. Andi Pratama, M.Kom.",
    className: "IF-6A",
    meetings: [
      { id: "rpl-01", date: "10 Februari 2026", topic: "Pengantar rekayasa perangkat lunak", status: "Hadir" },
      { id: "rpl-02", date: "17 Februari 2026", topic: "Analisis kebutuhan perangkat lunak", status: "Hadir" },
      { id: "rpl-03", date: "24 Februari 2026", topic: "Pemodelan kebutuhan dengan UML", status: "Hadir" },
      { id: "rpl-04", date: "3 Maret 2026", topic: "Arsitektur dan desain perangkat lunak", status: "Hadir" },
      { id: "rpl-05", date: "10 Maret 2026", topic: "Design pattern", status: "Hadir" },
      { id: "rpl-06", date: "17 Maret 2026", topic: "Pengujian perangkat lunak", status: "Hadir" },
      { id: "rpl-07", date: "24 Maret 2026", topic: "Manajemen konfigurasi", status: "Hadir" },
    ],
  },
  {
    id: "attendance-02",
    code: "IF304",
    name: "Pemrograman Web Lanjut",
    credits: 3,
    lecturer: "Nadia Kusuma, M.Cs.",
    className: "IF-6A",
    meetings: [
      { id: "web-01", date: "11 Februari 2026", topic: "Arsitektur aplikasi web modern", status: "Hadir" },
      { id: "web-02", date: "18 Februari 2026", topic: "TypeScript lanjutan", status: "Hadir" },
      { id: "web-03", date: "25 Februari 2026", topic: "State management", status: "Hadir" },
      { id: "web-04", date: "4 Maret 2026", topic: "Autentikasi aplikasi web", status: "Izin" },
      { id: "web-05", date: "11 Maret 2026", topic: "Optimasi performa frontend", status: "Hadir" },
      { id: "web-06", date: "18 Maret 2026", topic: "Pengujian komponen", status: "Hadir" },
      { id: "web-07", date: "25 Maret 2026", topic: "Deployment dan observability", status: "Hadir" },
    ],
  },
  {
    id: "attendance-03",
    code: "IF306",
    name: "Kecerdasan Buatan",
    credits: 3,
    lecturer: "Dr. Bima Saputra, M.T.",
    className: "IF-6B",
    meetings: [
      { id: "ai-01", date: "12 Februari 2026", topic: "Konsep dasar kecerdasan buatan", status: "Hadir" },
      { id: "ai-02", date: "19 Februari 2026", topic: "Representasi pengetahuan", status: "Hadir" },
      { id: "ai-03", date: "26 Februari 2026", topic: "Algoritma pencarian", status: "Alpa" },
      { id: "ai-04", date: "5 Maret 2026", topic: "Machine learning dasar", status: "Hadir" },
      { id: "ai-05", date: "12 Maret 2026", topic: "Klasifikasi dan evaluasi model", status: "Hadir" },
      { id: "ai-06", date: "19 Maret 2026", topic: "Jaringan saraf tiruan", status: "Alpa" },
      { id: "ai-07", date: "26 Maret 2026", topic: "Pemrosesan bahasa alami", status: "Hadir" },
    ],
  },
  {
    id: "attendance-04",
    code: "IF308",
    name: "Keamanan Informasi",
    credits: 3,
    lecturer: "Rizky Maulana, M.Kom.",
    className: "IF-6A",
    meetings: [
      { id: "security-01", date: "13 Februari 2026", topic: "Prinsip keamanan informasi", status: "Hadir" },
      { id: "security-02", date: "20 Februari 2026", topic: "Kriptografi simetris", status: "Hadir" },
      { id: "security-03", date: "27 Februari 2026", topic: "Kriptografi asimetris", status: "Hadir" },
      { id: "security-04", date: "6 Maret 2026", topic: "Keamanan jaringan", status: "Sakit" },
      { id: "security-05", date: "13 Maret 2026", topic: "Keamanan aplikasi", status: "Hadir" },
      { id: "security-06", date: "20 Maret 2026", topic: "Manajemen identitas", status: "Hadir" },
      { id: "security-07", date: "27 Maret 2026", topic: "Respons insiden", status: "Hadir" },
    ],
  },
  {
    id: "attendance-05",
    code: "IF310",
    name: "Interaksi Manusia dan Komputer",
    credits: 3,
    lecturer: "Sinta Rahma, M.Ds.",
    className: "IF-6A",
    meetings: [
      { id: "imk-01", date: "14 Februari 2026", topic: "Dasar interaksi manusia dan komputer", status: "Hadir" },
      { id: "imk-02", date: "21 Februari 2026", topic: "Riset pengguna", status: "Hadir" },
      { id: "imk-03", date: "28 Februari 2026", topic: "Persona dan user journey", status: "Hadir" },
      { id: "imk-04", date: "7 Maret 2026", topic: "Arsitektur informasi", status: "Hadir" },
      { id: "imk-05", date: "14 Maret 2026", topic: "Wireframe dan prototipe", status: "Hadir" },
      { id: "imk-06", date: "21 Maret 2026", topic: "Usability testing", status: "Hadir" },
      { id: "imk-07", date: "28 Maret 2026", topic: "Evaluasi pengalaman pengguna", status: "Hadir" },
    ],
  },
]
