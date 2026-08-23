import * as z from "zod"
import {
  requiredText,
  email,
  phoneNumber,
  gender,
  lecturerStatus,
  jabatan,
  numericValue,
} from "./common.schema"

export const personSchema = z.object({
  name: requiredText("Nama lengkap", 1, 100),

  email,

  username: requiredText(
    "Username",
    1,
    50,
  ).regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.",
  ),

  password: z
  .string()
  .min(8, "Password minimal 8 karakter.")
  .max(100, "Password maksimal 100 karakter.")
  .regex(/[A-Z]/, "Password harus memiliki minimal 1 huruf besar.")
  .regex(/[a-z]/, "Password harus memiliki minimal 1 huruf kecil.")
  .regex(/[0-9]/, "Password harus memiliki minimal 1 angka.")
  .regex(
    /[^A-Za-z0-9]/,
    "Password harus memiliki minimal 1 karakter khusus."
  ),

  gender,

  phoneNumber,

  address: requiredText(
    "Alamat",
    5,
    255,
  ),

  birthDate: z
  .date({
    error: "Tanggal lahir wajib diisi.",
  })
  .max(
    new Date(),
    "Tanggal lahir tidak boleh melebihi hari ini.",
  )
  .refine(
    (date) => {
      const today = new Date()

      let age =
        today.getFullYear() -
        date.getFullYear()

      const monthDiff =
        today.getMonth() -
        date.getMonth()

      if (
        monthDiff < 0 ||
        (
          monthDiff === 0 &&
          today.getDate() < date.getDate()
        )
      ) {
        age--
      }

      return age >= 17
    },
    "Mahasiswa harus berusia minimal 17 tahun.",
  ),
})


