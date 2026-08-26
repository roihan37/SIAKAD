import type { Dosen, Fakultas, Kurikulum, Mahasiswa, MataKuliah, ProgramStudi, Ruangan, TahunAkademik } from "./campus"

export interface AuthState {
    isLoading : boolean
    accessToken : string | null
    error: string | null
    initialized: boolean
}

export interface UsersState extends Pagination{
    error: string | null
    students: Mahasiswa[]
    lecturers: Dosen[]
    isLoadingStudents: boolean
    isCreatingStudent: boolean
    isLoadingLecturers: boolean
    isCreatingLecturer: boolean
}

export interface CampusState extends Pagination {
    isLoading : boolean
    error: string | null
    fakultas: Fakultas[]
    prodi: ProgramStudi[]
}

export interface MataKuliahState extends Pagination {
    isLoading : boolean
    error: string | null
    matkul: MataKuliah[]
}

export interface RuanganState extends Pagination{
    isLoading : boolean
    error: string | null
    ruangan: Ruangan[]
}

export interface TahunAkaState extends Pagination{
    isLoading : boolean
    error: string | null
    tAkademik: TahunAkademik[]
}

export interface KurikulumState extends Pagination {
    isLoading : boolean
    error: string | null
    kurikulum: Kurikulum[]
}

export interface Pagination {
    page: number
    limit: number
    totalPages: number
    totalRows?: number
    search : string,
    sortBy: string
    sortOrder: "asc" | "desc"
}