import { isAxiosError } from "axios"
import type { AuthFailure } from "@/types/auth"
export function authFailure(error: unknown): AuthFailure {
  if (error && typeof error === "object" && "message" in error && "code" in error && error.code === "SESSION_CHANGED") return { message: "Sesi telah berubah. Silakan masuk kembali.", code: "SESSION_CHANGED" }
  if (!isAxiosError<{ message?: string; code?: string }>(error)) return { message: "Autentikasi gagal. Silakan coba lagi." }
  const status = error.response?.status
  const header = error.response?.headers?.["retry-after"]
  const retry = typeof header === "string" || typeof header === "number" ? String(header) : ""
  const retryAt = retry ? (/^\d+(\.\d+)?$/.test(retry) ? Date.now() + Number(retry) * 1000 : Date.parse(retry)) : NaN
  return {
    status, code: error.response?.data?.code,
    message: status === 429 ? "Terlalu banyak percobaan. Tunggu sebelum mencoba kembali." : error.response?.data?.message ?? (status ? "Server sedang bermasalah. Silakan coba lagi." : "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi."),
    ...(status === 429 ? { retryAt: Number.isFinite(retryAt) ? Math.max(Date.now(), retryAt) : Date.now() + 60000 } : {}),
  }
}
export const sessionChanged = () => Object.assign(new Error("Session changed"), { code: "SESSION_CHANGED" })
export function validatePassword(current: string, password: string, confirmation: string): string | null {
  if (password !== confirmation) return "Konfirmasi password tidak cocok."
  if ([...password].length < 12) return "Password baru minimal 12 karakter."
  if (new TextEncoder().encode(password).length > 72) return "Password baru maksimal 72 byte UTF-8. Karakter seperti emoji dapat memakai lebih dari satu byte."
  if (current === password) return "Password baru harus berbeda dari password saat ini."
  return null
}
