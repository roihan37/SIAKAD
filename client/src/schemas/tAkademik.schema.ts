import * as z from "zod"
import {
  requiredText,
  semester,
} from "./common.schema"

export const tAkademikSchema = z.object({
  tahun: requiredText(
    "Tahun akademik",
    9,
    9,
  ).regex(
    /^\d{4}\/\d{4}$/,
    "Format tahun akademik harus YYYY/YYYY.",
  ),

  semester,
  isActive: z.boolean(),
})

export type TahunAkademikFormInput =
  z.input<typeof tAkademikSchema>

export type TahunAkademikFormValues =
  z.output<typeof tAkademikSchema>