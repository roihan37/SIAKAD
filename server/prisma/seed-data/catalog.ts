import { Hari, Semester, StatusKRS } from "@prisma/client";

export const programs = [
  {
    facultyCode: "FT", faculty: "Fakultas Teknik", code: "TI", name: "Teknik Informatika",
    lecturers: ["Dr. Budi Santoso, M.Kom.", "Rina Amelia, M.Kom.", "Dedi Rahman, M.Kom."],
    expertise: ["Basis Data", "Rekayasa Perangkat Lunak", "Algoritma dan Struktur Data"],
    students: ["Aditya Pratama", "Nadia Putri", "Rizky Ramadhan", "Salsa Aulia", "Fajar Hidayat", "Dinda Maharani", "Ilham Maulana", "Nabila Zahra"],
    previous: ["Algoritma dan Pemrograman II", "Matematika Diskrit", "Arsitektur Komputer", "Aljabar Linear", "Bahasa Inggris", "Pendidikan Kewarganegaraan"],
    current: ["Basis Data", "Struktur Data", "Pemrograman Web", "Sistem Operasi", "Jaringan Komputer", "Rekayasa Perangkat Lunak"],
  },
  {
    facultyCode: "FEB", faculty: "Fakultas Ekonomi dan Bisnis", code: "MN", name: "Manajemen",
    lecturers: ["Dr. Ahmad Fauzi, M.M.", "Siti Nurhayati, M.M.", "Hendra Wijaya, M.M."],
    expertise: ["Manajemen Strategis", "Manajemen Keuangan", "Manajemen Pemasaran"],
    students: ["Bagas Saputra", "Aisyah Rahma", "Yoga Firmansyah", "Intan Permata", "Reza Adinata", "Citra Lestari", "Dimas Arya", "Vina Anggraini"],
    previous: ["Pengantar Manajemen", "Pengantar Akuntansi", "Ekonomi Mikro", "Matematika Bisnis", "Bahasa Inggris Bisnis", "Pendidikan Kewarganegaraan"],
    current: ["Manajemen Pemasaran", "Manajemen Keuangan", "Manajemen SDM", "Statistika Bisnis", "Perilaku Organisasi", "Ekonomi Makro"],
  },
];

export const periods = [
  { tahun: "2025/2026", semester: Semester.GENAP, isActive: false, start: "2026-02-02", end: "2026-02-14", approval: "2026-02-10", level: 2 },
  { tahun: "2026/2027", semester: Semester.GANJIL, isActive: true, start: "2026-09-01", end: "2026-09-18", approval: "2026-09-10", level: 3 },
];
export const statuses = [StatusKRS.DISETUJUI, StatusKRS.DISETUJUI, StatusKRS.DISETUJUI, StatusKRS.DIAJUKAN, StatusKRS.DITOLAK, StatusKRS.DRAFT];
export const days = [Hari.SENIN, Hari.SELASA, Hari.RABU];

