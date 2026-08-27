import type { Dosen, Fakultas, Jadwal, Kurikulum, Mahasiswa, MataKuliah, ProgramStudi, Ruangan, TahunAkademik } from "./campus"

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
    isCreatingFakultas : boolean
    isCreatingProdi : boolean
}

export interface MataKuliahState extends Pagination {
    isLoading : boolean
    error: string | null
    matkul: MataKuliah[]
    isCreatingMatkul : boolean
}

export interface RuanganState extends Pagination{
    isLoading : boolean
    error: string | null
    ruangan: Ruangan[]
    isCreatingRuangan : boolean
}

export interface TahunAkaState extends Pagination{
    isLoading : boolean
    error: string | null
    tAkademik: TahunAkademik[]
    isCreatingTAkademik : boolean
}

export interface KurikulumState extends Pagination {
    isLoading : boolean
    error: string | null
    kurikulum: Kurikulum[]
    isCreatingKurikulum : boolean
}

export interface JadwalState extends Pagination{
    isLoading : boolean
    error: string | null
    jadwal: Jadwal[]
    isCreatingJadwal : boolean
}

export interface Pagination {
    page: number
    limit: number
    totalPages: number
    totalRows?: number
    search : string,
    sortBy: string
    sortOrder: "asc" | "desc"
    prodiId? : number
}