import * as z from "zod"
import {
  requiredText,
  numericValue,
  positiveId,
} from "./common.schema"

export const matkulSchema = z.object({
  kode: requiredText(
    "Kode mata kuliah",
    2,
    32,
  ),

  name_mk: requiredText(
    "Nama mata kuliah",
    3,
    100,
  ),

  sks: numericValue(
    "SKS",
    1,
    6,
  ),

  semester: numericValue(
    "Semester",
    1,
    14,
  ),

  prodiId: positiveId(
    "Program studi",
  ),
})

export type MatkulFormValues =
  z.infer<typeof matkulSchema>

export type MatkulFormInput =
  z.infer<typeof matkulSchema>