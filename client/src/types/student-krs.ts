export type StudentKrsStatus = "DRAFT" | "DIAJUKAN" | "DISETUJUI" | "DITOLAK" | null

export type StudentKrsSchedule = {
  id: number
  hari: string
  hariUrutan: number | null
  jamMulai: string
  jamSelesai: string
  room: {
    id: number
    kode: string
    nama: string
    gedung: string | null
  }
}

export type StudentKrsOffering = {
  kelasMataKuliahId: number
  course: {
    id: number
    kode: string
    nama: string
    sks: number
  }
  class: {
    id: number
    nama: string
  }
  lecturer: {
    id: string
    nidn: string
    name: string
  }
  schedules: StudentKrsSchedule[]
  selected: boolean
  canSelect: boolean
  unavailableReason: string | null
}

export type SelectedStudentKrsOffering = StudentKrsOffering & {
  krsDetailId: number
  status: "MENUNGGU" | "DISETUJUI" | "DITOLAK"
}

export type StudentKrsData = {
  academicYear: {
    id: number
    tahun: string
    semester: "GANJIL" | "GENAP"
    isActive: boolean
  }
  krsPeriod: {
    id: number
    tahunAkademikId: number
    mulai: string
    selesai: string
    isActive: boolean
    isOpen: boolean
  } | null
  krsId: string | null
  krsStatus: StudentKrsStatus
  selectedCredits: number
  permissions: {
    canEdit: boolean
    canSaveDraft: boolean
    canSubmit: boolean
  }
  availableCourses: StudentKrsOffering[]
  selectedKrsCourses: SelectedStudentKrsOffering[]
}
