export type KrsStatus =
  | "Belum Diajukan"
  | "Menunggu Persetujuan"
  | "Disetujui"
  | "Ditolak"

export type CourseRestriction = "full" | "prerequisite"

export type Course = {
  id: string
  code: string
  name: string
  credits: number
  className: string
  schedule: string
  scheduleKey: string
  room: string
  lecturer: string
  seatsLeft: number
  restriction?: CourseRestriction
  restrictionMessage?: string
}

export const krsProfile = {
  academicYear: "2026/2027 Ganjil",
  period: "1–14 Agustus 2026",
  creditLimit: 21,
  status: "Ditolak" as KrsStatus,
  rejectionReason:
    "Terdapat mata kuliah pilihan yang bentrok dengan jadwal wajib. Silakan perbaiki pilihan kelas dan ajukan kembali.",
  initialSelectedCourseIds: ["IF301", "IF303", "IF305", "IF307"],
}

export const availableCourses: Course[] = [
  {
    id: "IF301",
    code: "IF301",
    name: "Rekayasa Perangkat Lunak",
    credits: 3,
    className: "A",
    schedule: "Senin, 08.00–10.30",
    scheduleKey: "mon-0800",
    room: "Lab Komputasi 2",
    lecturer: "Dr. Rina Kurniawati, M.Kom.",
    seatsLeft: 8,
  },
  {
    id: "IF303",
    code: "IF303",
    name: "Kecerdasan Buatan",
    credits: 3,
    className: "B",
    schedule: "Selasa, 10.30–13.00",
    scheduleKey: "tue-1030",
    room: "R. 4.12",
    lecturer: "Andi Pratama, M.Cs.",
    seatsLeft: 4,
  },
  {
    id: "IF305",
    code: "IF305",
    name: "Jaringan Komputer Lanjut",
    credits: 3,
    className: "A",
    schedule: "Rabu, 13.00–15.30",
    scheduleKey: "wed-1300",
    room: "Lab Jaringan",
    lecturer: "Dimas Saputra, M.Kom.",
    seatsLeft: 12,
  },
  {
    id: "IF307",
    code: "IF307",
    name: "Interaksi Manusia dan Komputer",
    credits: 3,
    className: "C",
    schedule: "Kamis, 08.00–10.30",
    scheduleKey: "thu-0800",
    room: "R. 3.08",
    lecturer: "Nadia Putri, M.Ds.",
    seatsLeft: 6,
  },
  {
    id: "IF309",
    code: "IF309",
    name: "Komputasi Awan",
    credits: 3,
    className: "A",
    schedule: "Jumat, 08.00–10.30",
    scheduleKey: "fri-0800",
    room: "Lab Komputasi 1",
    lecturer: "Fajar Nugroho, M.Kom.",
    seatsLeft: 10,
  },
  {
    id: "IF311",
    code: "IF311",
    name: "Data Mining",
    credits: 3,
    className: "B",
    schedule: "Jumat, 13.00–15.30",
    scheduleKey: "fri-1300",
    room: "R. 4.05",
    lecturer: "Dr. Maya Lestari, M.Kom.",
    seatsLeft: 2,
  },
  {
    id: "IF313",
    code: "IF313",
    name: "Manajemen Proyek TI",
    credits: 3,
    className: "B",
    schedule: "Senin, 08.00–10.30",
    scheduleKey: "mon-0800",
    room: "R. 2.10",
    lecturer: "Reza Mahendra, M.MSI.",
    seatsLeft: 7,
  },
  {
    id: "IF317",
    code: "IF317",
    name: "Pengembangan Aplikasi Bergerak",
    credits: 3,
    className: "A",
    schedule: "Selasa, 08.00–10.30",
    scheduleKey: "tue-0800",
    room: "Lab Komputasi 3",
    lecturer: "Ayu Permata, M.Kom.",
    seatsLeft: 11,
  },
  {
    id: "IF319",
    code: "IF319",
    name: "Analitik Big Data",
    credits: 3,
    className: "B",
    schedule: "Rabu, 10.30–13.00",
    scheduleKey: "wed-1030",
    room: "Lab Data",
    lecturer: "Dr. Yoga Prasetyo, M.Kom.",
    seatsLeft: 5,
  },
  {
    id: "IF315",
    code: "IF315",
    name: "Keamanan Aplikasi",
    credits: 3,
    className: "A",
    schedule: "Rabu, 08.00–10.30",
    scheduleKey: "wed-0800",
    room: "Lab Siber",
    lecturer: "Dr. Bagus Wicaksono, M.Kom.",
    seatsLeft: 0,
    restriction: "full",
    restrictionMessage: "Kelas penuh. Pilih kelas lain atau pantau ketersediaan kursi.",
  },
  {
    id: "IF401",
    code: "IF401",
    name: "Pemrosesan Bahasa Alami",
    credits: 3,
    className: "A",
    schedule: "Kamis, 13.00–15.30",
    scheduleKey: "thu-1300",
    room: "R. 4.09",
    lecturer: "Dr. Siti Rahma, M.Sc.",
    seatsLeft: 9,
    restriction: "prerequisite",
    restrictionMessage: "Prasyarat IF304 Machine Learning belum terpenuhi.",
  },
]
