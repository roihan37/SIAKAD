export type StudentGradeSemester = "GANJIL" | "GENAP"

export interface StudentGradeAcademicYear {
  id: number
  tahun: string
  semester: StudentGradeSemester
  isActive: boolean
}

export interface StudentGradeCourse {
  id: string
  mataKuliah: {
    id: number
    kode: string
    nama: string
    sks: number
  }
  nilai: number | null
  grade: string | null
  bobot: number
}

export interface StudentGradeReport {
  tahunAkademik: {
    id: number
    tahun: string
    semester: StudentGradeSemester
    label: string
  }
  details: StudentGradeCourse[]
  summary: {
    totalSKS: number
    ips: number
    ipk: number
  }
}

export type StudentGradeUnavailableReason =
  | "KRS_NOT_APPROVED"
  | "KRS_NOT_FOUND"
  | "GRADES_NOT_AVAILABLE"

export interface StudentGradeResponse {
  nilai: StudentGradeReport | null
  reason: StudentGradeUnavailableReason | null
}
