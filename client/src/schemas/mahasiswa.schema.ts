import * as z from "zod"

import {
  requiredText,
  numericValue,
  positiveId,
  studentStatus,
} from "./common.schema"

import { personSchema } from "./person.schema"

export const mahasiswaSchema = personSchema.extend({
  nik: requiredText("NIK", 16, 16)
    .regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit angka."),

  birthPlace: requiredText("Tempat lahir", 2, 100),

  nim: requiredText("NIM", 5, 30)
    .regex(/^\d+$/, "NIM hanya boleh berisi angka."),

  angkatan: numericValue("Angkatan", 2000, new Date().getFullYear()),

  semester: numericValue("Semester", 1, 14),

  status: studentStatus,

  fakultasId: positiveId("Fakultas"),


  prodiId: positiveId("Program studi"),

  dosenId: requiredText("Dosen wali", 1, 100),
})

export type MahasiswaFormInput =
  z.input<typeof mahasiswaSchema>

export type MahasiswaFormValues =
  z.output<typeof mahasiswaSchema>

// Edit validates only fields rendered by the form; nullable profile data may stay empty.
export const mahasiswaEditSchema = mahasiswaSchema.omit({
  username: true, password: true, semester: true,
}).extend({
  nik: mahasiswaSchema.shape.nik.or(z.literal("")).optional(),
  birthPlace: mahasiswaSchema.shape.birthPlace.or(z.literal("")).optional(),
  gender: personSchema.shape.gender.optional(),
  birthDate: personSchema.shape.birthDate.optional(),
  phoneNumber: personSchema.shape.phoneNumber.or(z.literal("")),
  address: personSchema.shape.address.or(z.literal("")),
  dosenId: z.string().max(100).optional(),
})

export type MahasiswaEditFormInput = z.input<typeof mahasiswaEditSchema>
export type MahasiswaEditFormValues = z.output<typeof mahasiswaEditSchema>