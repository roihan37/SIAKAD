import type { Dosen, Fakultas, Mahasiswa, MataKuliah, ProgramStudi } from "./campus"

export interface AuthState {
    isLoading : boolean
    accessToken : string | null
    error: string | null
    initialized: boolean
}

export interface UsersState extends Pagination{
    isLoading : boolean
    error: string | null
    students: Mahasiswa[]
    lecturers: Dosen[]
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

export interface Pagination {
    page: number
    limit: number
    totalPages: number
    totalRows?: number
    search : string,
    sortBy: string
    sortOrder: "asc" | "desc"
}