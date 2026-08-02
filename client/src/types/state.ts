export interface AuthState {
    isLoading : boolean
    accessToken : string | null
    error: string | null
    initialized: boolean
}

export interface UsersState {
    isLoading : boolean
    error: string | null
    students: object | null
}