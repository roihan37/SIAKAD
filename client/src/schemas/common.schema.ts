import * as z from "zod"

export const requiredText = (
  label: string,
  min = 1,
  max = 100,
) =>
  z
    .string()
    .trim()
    .min(min, `${label} wajib diisi.`)
    .max(max, `${label} maksimal ${max} karakter.`)

export const numericValue = (
  label: string,
  min: number,
  max: number,
) =>
  z.preprocess(
    (value) => {
      if (value === "") {
        return undefined
      }

      if (typeof value === "string") {
        const number = Number(value)

        return Number.isNaN(number)
          ? value
          : number
      }

      return value
    },
    z
      .number({
        error: `${label} wajib berupa angka.`,
      })
      .int(`${label} harus berupa bilangan bulat.`)
      .min(min, `${label} minimal ${min}.`)
      .max(max, `${label} maksimal ${max}.`),
  )

export const positiveId = (label: string) =>
  z
    .number({
      error: `${label} wajib dipilih.`,
    })
    .int(`${label} tidak valid.`)
    .positive(`${label} wajib dipilih.`)

export const email = z.email("Format email tidak valid.")

export const isActive = z.boolean

export const phoneNumber = requiredText(
  "Nomor telepon",
  8,
  20,
).regex(
  /^[0-9+()\-\s]+$/,
  "Format nomor telepon tidak valid.",
)

export const gender = z.enum(
  ["Male", "Female"],
  {
    error: "Jenis kelamin wajib dipilih.",
  },
)

export const lecturerStatus = z.enum(
  ["Aktif", "Cuti", "Lulus", "Nonaktif"],
  {
    error: "Status dosen wajib dipilih.",
  },
)

export const studentStatus = z.enum(
  ["Aktif", "Cuti", "Lulus", "DO"],
  {
    error: "Status mahasiswa wajib dipilih.",
  },
)

export const jabatan = z.enum(
  ["Dosen", "Kaprodi", "Dekan", "Rektor"],
  {
    error: "Jabatan wajib dipilih.",
  },
)

export const semester = z.enum(
  ["GANJIL", "GENAP"],
    {
      error: "Semester wajib dipilih.",
    }
)