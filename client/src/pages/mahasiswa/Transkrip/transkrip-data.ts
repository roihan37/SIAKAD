export type TranscriptStatus = "Final" | "Sedang Ditempuh" | "Belum Ada Nilai"

export type TranscriptCourse = {
  id: string
  code: string
  name: string
  credits: number
  grade: string | null
  status: TranscriptStatus
}

export type TranscriptSemester = {
  id: string
  label: string
  academicYear: string
  semesterGpa: string | null
  totalCredits: number
  courses: TranscriptCourse[]
}

const finalCourse = (id: string, code: string, name: string, grade: string): TranscriptCourse => ({
  id,
  code,
  name,
  credits: 3,
  grade,
  status: "Final",
})

export const transcriptProfile = {
  cumulativeGpa: "3,72",
  completedCredits: 108,
  requiredCredits: 144,
}

export const transcriptSemesters: TranscriptSemester[] = [
  {
    id: "2025-2026-genap",
    label: "Semester 7",
    academicYear: "2025/2026 Genap",
    semesterGpa: null,
    totalCredits: 18,
    courses: [
      { id: "s7-1", code: "IF401", name: "Metodologi Penelitian", credits: 3, grade: null, status: "Sedang Ditempuh" },
      { id: "s7-2", code: "IF403", name: "Komputasi Awan", credits: 3, grade: null, status: "Sedang Ditempuh" },
      { id: "s7-3", code: "IF405", name: "Pengolahan Bahasa Alami", credits: 3, grade: null, status: "Sedang Ditempuh" },
      { id: "s7-4", code: "IF407", name: "Manajemen Layanan TI", credits: 3, grade: null, status: "Sedang Ditempuh" },
      { id: "s7-5", code: "IF409", name: "Etika Profesi TI", credits: 3, grade: null, status: "Belum Ada Nilai" },
      { id: "s7-6", code: "IF411", name: "Technopreneurship", credits: 3, grade: null, status: "Belum Ada Nilai" },
    ],
  },
  {
    id: "2025-2026-ganjil",
    label: "Semester 6",
    academicYear: "2025/2026 Ganjil",
    semesterGpa: "3,83",
    totalCredits: 18,
    courses: [
      finalCourse("s6-1", "IF302", "Rekayasa Perangkat Lunak", "A"),
      finalCourse("s6-2", "IF304", "Pemrograman Web Lanjut", "AB"),
      finalCourse("s6-3", "IF306", "Kecerdasan Buatan", "A"),
      finalCourse("s6-4", "IF308", "Keamanan Informasi", "A"),
      finalCourse("s6-5", "IF310", "Interaksi Manusia dan Komputer", "A"),
      finalCourse("s6-6", "IF312", "Manajemen Proyek TI", "AB"),
    ],
  },
  {
    id: "2024-2025-genap",
    label: "Semester 5",
    academicYear: "2024/2025 Genap",
    semesterGpa: "3,75",
    totalCredits: 18,
    courses: [
      finalCourse("s5-1", "IF301", "Basis Data Lanjut", "A"),
      finalCourse("s5-2", "IF303", "Jaringan Komputer", "AB"),
      finalCourse("s5-3", "IF305", "Sistem Operasi", "A"),
      finalCourse("s5-4", "IF307", "Analisis dan Desain Sistem", "AB"),
      finalCourse("s5-5", "IF309", "Grafika Komputer", "B+"),
      finalCourse("s5-6", "IF311", "Statistika Komputasi", "A"),
    ],
  },
  {
    id: "2024-2025-ganjil",
    label: "Semester 4",
    academicYear: "2024/2025 Ganjil",
    semesterGpa: "3,71",
    totalCredits: 18,
    courses: [
      finalCourse("s4-1", "IF202", "Algoritma dan Struktur Data", "A"),
      finalCourse("s4-2", "IF204", "Pemrograman Berorientasi Objek", "A"),
      finalCourse("s4-3", "IF206", "Sistem Basis Data", "AB"),
      finalCourse("s4-4", "IF208", "Rekayasa Kebutuhan", "AB"),
      finalCourse("s4-5", "IF210", "Pemrograman Mobile", "B+"),
      finalCourse("s4-6", "IF212", "Matematika Diskrit", "A"),
    ],
  },
  {
    id: "2023-2024-genap",
    label: "Semester 3",
    academicYear: "2023/2024 Genap",
    semesterGpa: "3,68",
    totalCredits: 18,
    courses: [
      finalCourse("s3-1", "IF201", "Pemrograman Web", "A"),
      finalCourse("s3-2", "IF203", "Arsitektur Komputer", "AB"),
      finalCourse("s3-3", "IF205", "Aljabar Linear", "B+"),
      finalCourse("s3-4", "IF207", "Interaksi Manusia dan Komputer", "A"),
      finalCourse("s3-5", "IF209", "Probabilitas dan Statistika", "AB"),
      finalCourse("s3-6", "IF211", "Bahasa Inggris Akademik", "A"),
    ],
  },
  {
    id: "2023-2024-ganjil",
    label: "Semester 2",
    academicYear: "2023/2024 Ganjil",
    semesterGpa: "3,62",
    totalCredits: 18,
    courses: [
      finalCourse("s2-1", "IF102", "Dasar Pemrograman", "A"),
      finalCourse("s2-2", "IF104", "Kalkulus II", "AB"),
      finalCourse("s2-3", "IF106", "Logika Informatika", "A"),
      finalCourse("s2-4", "IF108", "Organisasi Komputer", "B+"),
      finalCourse("s2-5", "IF110", "Sistem Digital", "AB"),
      finalCourse("s2-6", "UNI102", "Pendidikan Kewarganegaraan", "A"),
    ],
  },
  {
    id: "2022-2023-genap",
    label: "Semester 1",
    academicYear: "2022/2023 Genap",
    semesterGpa: "3,56",
    totalCredits: 18,
    courses: [
      finalCourse("s1-1", "IF101", "Pengantar Informatika", "A"),
      finalCourse("s1-2", "IF103", "Kalkulus I", "AB"),
      finalCourse("s1-3", "IF105", "Dasar Sistem Komputer", "B+"),
      finalCourse("s1-4", "IF107", "Pemecahan Masalah Komputasional", "A"),
      finalCourse("s1-5", "UNI101", "Bahasa Indonesia", "AB"),
      finalCourse("s1-6", "UNI103", "Pendidikan Agama", "A"),
    ],
  },
]
