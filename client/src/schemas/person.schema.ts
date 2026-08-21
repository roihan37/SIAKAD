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
  name: requiredText("Nama lengkap", 3, 100),

  email,

  username: requiredText(
    "Username",
    3,
    50,
  ).regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.",
  ),

  password: z
    .string()
    .min(8, "Password minimal 8 karakter.")
    .max(100, "Password maksimal 100 karakter."),

  gender,

  phoneNumber,

  address: requiredText(
    "Alamat",
    5,
    255,
  ),

  birthDate: z.date().optional(),
})


