import type { Dosen, Fakultas, Mahasiswa, ProgramStudi } from "./campus"

export interface AuthState {
    isLoading : boolean
    accessToken : string | null
    error: string | null
    initialized: boolean
}

export interface UsersState {
    isLoading : boolean
    error: string | null
    students: Mahasiswa[]
    lecturers: Dosen[]
}

export interface CampusState {
    isLoading : boolean
    error: string | null
    fakultas: Fakultas[]
    prodi: ProgramStudi[]
}