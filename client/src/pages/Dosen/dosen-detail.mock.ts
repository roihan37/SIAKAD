export const lecturerProfile = {
  name: "Dr. Nadia Rahmawati, S.Kom., M.Kom.",
  nidn: "0015088703",
  gender: "Perempuan",
  birthPlace: "Bandung",
  birthDate: "15 Agustus 1987",
  email: "nadia.rahmawati@example.com",
  phone: "0812 0000 1234",
  address: "Jl. Pendidikan No. 12, Bandung, Jawa Barat",
  faculty: "Fakultas Ilmu Komputer",
  program: "Informatika",
  position: "Dosen Tetap",
  functionalPosition: "Lektor",
  employment: "Dosen Tetap Yayasan",
  joined: "1 September 2015",
  expertise: "Rekayasa Perangkat Lunak, Interaksi Manusia dan Komputer",
  office: "Gedung A · Ruang Dosen 203",
  consultation: "Rabu, 13.00–15.00 WIB",
}

export const education = [
  { degree: "S3 · Ilmu Komputer", institution: "Universitas Indonesia", year: "2020–2024" },
  { degree: "S2 · Teknik Informatika", institution: "Institut Teknologi Bandung", year: "2011–2013" },
  { degree: "S1 · Teknik Informatika", institution: "Universitas Padjadjaran", year: "2005–2009" },
]

export const semesters = ["2026/2027 Ganjil", "2025/2026 Genap"] as const
export type Semester = (typeof semesters)[number]
export const teaching = [
  { id: "IF301-A", name: "Rekayasa Perangkat Lunak", code: "IF301", credits: 3, group: "IF-5A", students: 32, day: "Senin", time: "08.00–10.30", room: "A-301", semester: semesters[0] },
  { id: "IF303-A", name: "Interaksi Manusia dan Komputer", code: "IF303", credits: 3, group: "IF-5A", students: 32, day: "Selasa", time: "10.30–13.00", room: "Lab UI/UX", semester: semesters[0] },
  { id: "IF301-B", name: "Rekayasa Perangkat Lunak", code: "IF301", credits: 3, group: "IF-5B", students: 30, day: "Kamis", time: "08.00–10.30", room: "A-302", semester: semesters[0] },
  { id: "IF204-A", name: "Pemrograman Web", code: "IF204", credits: 3, group: "IF-4A", students: 28, day: "Senin", time: "08.00–10.30", room: "Lab Komputer", semester: semesters[1] },
  { id: "IF206-A", name: "Analisis dan Desain Sistem", code: "IF206", credits: 3, group: "IF-4A", students: 28, day: "Rabu", time: "10.30–13.00", room: "A-201", semester: semesters[1] },
]

export const advisees = [
  { nim: "202301001", name: "Aditya Pratama", cohort: 2023, semester: 7, status: "Aktif", krs: "Menunggu persetujuan" },
  { nim: "202301014", name: "Salma Putri", cohort: 2023, semester: 7, status: "Aktif", krs: "Disetujui" },
  { nim: "202401007", name: "Rizky Ramadhan", cohort: 2024, semester: 5, status: "Aktif", krs: "Disetujui" },
  { nim: "202401021", name: "Alya Maharani", cohort: 2024, semester: 5, status: "Cuti", krs: "Tidak mengajukan" },
  { nim: "202501005", name: "Fajar Maulana", cohort: 2025, semester: 3, status: "Aktif", krs: "Menunggu persetujuan" },
  { nim: "202501019", name: "Nabila Zahra", cohort: 2025, semester: 3, status: "Aktif", krs: "Disetujui" },
]
