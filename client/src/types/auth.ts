export interface AuthUser { id: string; role: string; mustChangePassword: boolean }
export interface AuthSession { accessToken: string; user: AuthUser }
export interface AuthFailure { message: string; status?: number; code?: string; retryAt?: number }
export interface LoginRequest { identifier: string; password: string }
export interface PasswordRequest { currentPassword: string; newPassword: string }
