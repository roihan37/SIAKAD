import * as z from "zod"
import {
  requiredText,
  numericValue,
  
} from "./common.schema"

export const matkulSchema = z.object({
  kode: requiredText("Kode mata kuliah", 2, 32),
  nama: requiredText("Nama mata kuliah", 3, 100),
  sks: numericValue("SKS", 1, 6),
  semester: numericValue("Semester", 1, 14),
  prodiId: z
    .number({
      error: "Program studi wajib dipilih.",
    })
    .int()
    .positive("Program studi wajib dipilih."),
})

export type MatkulFormInput =
  z.input<typeof matkulSchema>

export type MatkulFormValues =
  z.output<typeof matkulSchema>