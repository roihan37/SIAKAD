import * as z from "zod"

const requiredText = (label: string, min = 1, max = 100) =>
  z.string().trim().min(min, `${label} wajib diisi.`).max(max, `${label} maksimal ${max} karakter.`)

const numericValue = (label: string, min: number, max: number) =>
  z.preprocess(
    (value) => (value === "" ? undefined : typeof value === "string" ? Number(value) : value),
    z.number({ error: `${label} wajib berupa angka.` })
      .int(`${label} harus berupa bilangan bulat.`)
      .min(min, `${label} minimal ${min}.`)
      .max(max, `${label} maksimal ${max}.`),
  )

const email = z.email("Format email tidak valid.")
const gender = z.enum(["Male", "Female"], { error: "Jenis kelamin wajib dipilih." })
const lecturerStatus = z.enum(["Aktif", "Cuti", "Lulus", "Nonaktif"], { error: "Status dosen wajib dipilih." })
const studentStatus = z.enum(["Aktif", "Cuti", "Lulus", "DO"], { error: "Status mahasiswa wajib dipilih." })
const jabatan = z.enum(["Dosen", "Kaprodi", "Dekan", "Rektor"], { error: "Jabatan wajib dipilih." })

export const fakultasSchema = z.object({
  kode: requiredText("Kode fakultas", 2, 32),
  name: requiredText("Nama fakultas", 3, 100),
})

export const prodiSchema = z.object({
  kode: requiredText("Kode program studi", 2, 32),
  name: requiredText("Nama program studi", 3, 100),
  fakultasId: z.number({ error: "Fakultas induk wajib dipilih." }).int().positive("Fakultas induk wajib dipilih."),
})

export const matkulSchema = z.object({
  kode: requiredText("Kode mata kuliah", 2, 32),
  name_mk: requiredText("Nama mata kuliah", 3, 100),
  sks: numericValue("SKS", 1, 6),
  semester: numericValue("Semester", 1, 14),
  prodiId: z.number({ error: "Program studi wajib dipilih." }).int().positive("Program studi wajib dipilih."),
})

export const ruanganSchema = z.object({
  kode: requiredText("Kode ruangan", 2, 32),
  nama: requiredText("Nama ruangan", 3, 100),
  kapasitas: numericValue("Kapasitas", 20, 50),
  gedung: requiredText("Gedung", 2, 100),
})

const personSchema = z.object({
  name: requiredText("Nama lengkap", 3, 100),
  email,
  username: requiredText("Username", 3, 50).regex(/^[a-zA-Z0-9._-]+$/, "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung."),
  password: z.string().min(8, "Password minimal 8 karakter.").max(100, "Password maksimal 100 karakter."),
  gender,
  phoneNumber: requiredText("Nomor telepon", 8, 20),
  address: requiredText("Alamat", 5, 255),
  birthDate: z.date().optional(),
})

export const dosenSchema = personSchema.extend({
  nidn: requiredText("NIDN", 5, 20).regex(/^\d+$/, "NIDN hanya boleh berisi angka."),
  status: lecturerStatus,
  jabatan,
  prodiId: z.number({ error: "Program studi wajib dipilih." }).int().positive("Program studi wajib dipilih."),
})

export const mahasiswaSchema = personSchema.extend({
  nim: requiredText("NIM", 5, 30).regex(/^\d+$/, "NIM hanya boleh berisi angka."),
  angkatan: numericValue("Angkatan", 2000, 2100),
  semester: numericValue("Semester", 1, 14),
  status: studentStatus,
  prodiId: z.number({ error: "Program studi wajib dipilih." }).int().positive("Program studi wajib dipilih."),
  dosenId: requiredText("Dosen wali", 1, 100),
})

export const confirmationSchema = z.literal(true, "Konfirmasi data sebelum menyimpan.")

export type DosenFormValues = z.infer<typeof dosenSchema>
export type MahasiswaFormValues = z.infer<typeof mahasiswaSchema>
