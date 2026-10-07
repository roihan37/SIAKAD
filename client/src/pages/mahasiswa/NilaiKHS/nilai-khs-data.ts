export type GradeStatus = "Final" | "Belum Lengkap" | "Belum Diumumkan"

export type GradeComponent = {
  label: string
  weight: number
  score: number | null
}

export type CourseGrade = {
  id: string
  code: string
  name: string
  credits: number
  lecturer: string
  className: string
  finalScore: number | null
  grade: string | null
  status: GradeStatus
  components: GradeComponent[]
}

export const gradeProfile = {
  academicYear: "2025/2026",
  semester: "Genap",
  gpa: "3,72",
  semesterGpa: "3,68",
  semesterCredits: 21,
  completedCredits: 108,
  requiredCredits: 144,
}

export const courseGrades: CourseGrade[] = [
  {
    id: "grade-01",
    code: "IF302",
    name: "Rekayasa Perangkat Lunak",
    credits: 3,
    lecturer: "Dr. Andi Pratama, M.Kom.",
    className: "IF-6A",
    finalScore: 88,
    grade: "A",
    status: "Final",
    components: [
      { label: "Tugas & Proyek", weight: 35, score: 90 },
      { label: "UTS", weight: 30, score: 84 },
      { label: "UAS", weight: 35, score: 89 },
    ],
  },
  {
    id: "grade-02",
    code: "IF304",
    name: "Pemrograman Web Lanjut",
    credits: 3,
    lecturer: "Nadia Kusuma, M.Cs.",
    className: "IF-6A",
    finalScore: 82,
    grade: "AB",
    status: "Final",
    components: [
      { label: "Praktikum", weight: 30, score: 86 },
      { label: "UTS", weight: 30, score: 78 },
      { label: "UAS", weight: 40, score: 82 },
    ],
  },
  {
    id: "grade-03",
    code: "IF306",
    name: "Kecerdasan Buatan",
    credits: 3,
    lecturer: "Dr. Bima Saputra, M.T.",
    className: "IF-6B",
    finalScore: null,
    grade: null,
    status: "Belum Lengkap",
    components: [
      { label: "Tugas", weight: 25, score: 84 },
      { label: "UTS", weight: 30, score: 79 },
      { label: "UAS", weight: 45, score: null },
    ],
  },
  {
    id: "grade-04",
    code: "IF308",
    name: "Keamanan Informasi",
    credits: 3,
    lecturer: "Rizky Maulana, M.Kom.",
    className: "IF-6A",
    finalScore: 91,
    grade: "A",
    status: "Final",
    components: [
      { label: "Studi Kasus", weight: 30, score: 92 },
      { label: "UTS", weight: 30, score: 88 },
      { label: "UAS", weight: 40, score: 93 },
    ],
  },
  {
    id: "grade-05",
    code: "IF310",
    name: "Interaksi Manusia dan Komputer",
    credits: 3,
    lecturer: "Sinta Rahma, M.Ds.",
    className: "IF-6A",
    finalScore: 85,
    grade: "A",
    status: "Final",
    components: [
      { label: "Riset Pengguna", weight: 30, score: 86 },
      { label: "Prototipe", weight: 35, score: 89 },
      { label: "UAS", weight: 35, score: 80 },
    ],
  },
  {
    id: "grade-06",
    code: "IF312",
    name: "Manajemen Proyek TI",
    credits: 3,
    lecturer: "Dimas Haryanto, M.Kom.",
    className: "IF-6B",
    finalScore: 79,
    grade: "AB",
    status: "Final",
    components: [
      { label: "Tugas Kelompok", weight: 35, score: 82 },
      { label: "UTS", weight: 30, score: 75 },
      { label: "UAS", weight: 35, score: 79 },
    ],
  },
  {
    id: "grade-07",
    code: "IF314",
    name: "Data Mining",
    credits: 3,
    lecturer: "Dr. Maya Lestari, M.Cs.",
    className: "IF-6A",
    finalScore: null,
    grade: null,
    status: "Belum Diumumkan",
    components: [
      { label: "Tugas", weight: 30, score: null },
      { label: "UTS", weight: 30, score: null },
      { label: "UAS", weight: 40, score: null },
    ],
  },
]
