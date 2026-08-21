import * as z from "zod"

import {
  requiredText,
  numericValue,
  positiveId,
  studentStatus,
} from "./common.schema"

import { personSchema } from "./person.schema"

export const mahasiswaSchema =
  personSchema.extend({
    nim: requiredText(
      "NIM",
      5,
      30,
    ).regex(
      /^\d+$/,
      "NIM hanya boleh berisi angka.",
    ),

    angkatan: numericValue(
      "Angkatan",
      2000,
      2100,
    ),

    semester: numericValue(
      "Semester",
      1,
      14,
    ),

    status: studentStatus,

    prodiId: positiveId(
      "Program studi",
    ),

    dosenId: requiredText(
      "Dosen wali",
      1,
      100,
    ),
  })

export type MahasiswaFormValues =
  z.infer<typeof mahasiswaSchema>