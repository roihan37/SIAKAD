export type StudentContact = {
  email: string
  phone: string
  address: string
}

export const studentProfile = {
  fullName: "Raka Aditya Pratama",
  nim: "220411100127",
  nik: "3578011505040003",
  gender: "Laki-laki",
  birthPlace: "Surabaya",
  birthDate: "15 Mei 2004",
  faculty: "Fakultas Teknik",
  studyProgram: "Informatika",
  enrollmentYear: "2022",
  semester: "8",
  academicStatus: "Aktif",
  academicAdvisor: "Dr. Eng. Budi Santoso, S.Kom., M.Kom.",
  curriculum: "Kurikulum Informatika 2022",
  username: "220411100127",
  loginEmail: "raka.aditya@student.ac.id",
  role: "Mahasiswa",
  accountStatus: "Aktif",
  lastLogin: "7 Oktober 2026, 08.42 WIB",
  avatarUrl: null,
} as const

export const initialStudentContact: StudentContact = {
  email: "raka.aditya@student.ac.id",
  phone: "0812 3456 7890",
  address: "Jl. Ketintang Baru No. 21, Gayungan, Surabaya, Jawa Timur 60231",
}
