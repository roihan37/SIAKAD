export type StudentGender = "Male" | "Female"
export type StudentStatus = "Aktif" | "Cuti" | "Lulus" | "Nonaktif"

export type AcademicUnit = {
  id: number
  code: string
  name: string
}

export type StudentProfileData = {
  header: {
    avatarUrl: string | null
    name: string
    nim: string
    studyProgram: AcademicUnit
    faculty: AcademicUnit
    status: StudentStatus
  }
  personal: {
    name: string
    nik: string | null
    gender: StudentGender | null
    birthPlace: string | null
    birthDate: string | null
    email: string
    phoneNumber: string | null
    address: string | null
  }
  academic: {
    nim: string
    faculty: AcademicUnit
    studyProgram: AcademicUnit
    cohort: number
    semester: number
    status: StudentStatus
    academicAdvisor: { id: string; nidn: string; name: string } | null
    curriculum: { id: number; code: string; name: string; year: number } | null
  }
  account: {
    username: string
    loginEmail: string
    role: "Mahasiswa"
  }
}

export type StudentProfileUpdate = {
  email?: string
  phoneNumber?: string | null
  address?: string | null
  birthPlace?: string | null
  birthDate?: string | null
  gender?: StudentGender
}
