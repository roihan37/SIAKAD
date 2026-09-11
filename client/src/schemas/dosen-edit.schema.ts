import { z } from "zod"

function validBirthDate(value: string) {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false
  const today = new Date()
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  return value <= localToday
}

export const dosenEditSchema = z.object({
  name: z.string().trim().min(1, "Nama lengkap wajib diisi.").max(100, "Maksimal 100 karakter."),
  nidn: z.string().trim().regex(/^\d{5,20}$/, "NIDN harus berisi 5–20 digit angka."),
  email: z.string().trim().email("Masukkan email yang valid."),
  gender: z.enum(["Male", "Female", ""]),
  birthDate: z.string().refine(validBirthDate, "Tanggal lahir tidak valid atau melewati hari ini."),
  phoneNumber: z.string().trim().refine((value) => !value || /^[+\d\s()-]{8,20}$/.test(value), "Nomor telepon harus berisi 8–20 karakter yang valid."),
  address: z.string().trim().max(255, "Alamat maksimal 255 karakter."),
  fakultasId: z.number().int().positive("Pilih fakultas."),
  prodiId: z.number().int().positive("Pilih program studi."),
})
export type DosenEditValues = z.infer<typeof dosenEditSchema>
export type UpdateLecturerPayload = Partial<Omit<DosenEditValues, "fakultasId" | "birthDate" | "gender">> & {
  birthDate?: string | null
  gender?: "Male" | "Female"
}
