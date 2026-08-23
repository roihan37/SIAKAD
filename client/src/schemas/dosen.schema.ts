import * as z from "zod"

import {
  requiredText,
  positiveId,
  numericValue,
  lecturerStatus,
  jabatan,
} from "./common.schema"

import { personSchema } from "./person.schema"

export const dosenSchema =
  personSchema.extend({
    nidn: requiredText(
      "NIDN",
      5,
      20,
    ).regex(
      /^\d+$/,
      "NIDN hanya boleh berisi angka.",
    ),

    status: lecturerStatus,
    fakultasId: z
    .number({
      error: "Fakultas wajib dipilih.",
    })
    .int()
    .positive(
      "Fakultas wajib dipilih."
    ),

    jabatan,
    prodiId: positiveId(
      "Program studi",
    ),
  })

export type DosenFormValues =
  z.infer<typeof dosenSchema>

export type DosenFormInput = 
  z.infer<typeof dosenSchema>