import * as z from "zod"
import {
  requiredText,
  numericValue,
  
} from "./common.schema"

export const kurikulumSchema = z.object({
  kode: requiredText("Kode kurikulum", 2, 32),
  nama: requiredText("Nama kurikulum", 3, 100),
  tahun: numericValue("Tahun", 2000, 2100),
  prodiId: z
    .number({
      error: "Program studi wajib dipilih.",
    })
    .int()
    .positive("Program studi wajib dipilih."),
  isActive: z.boolean(),
})

export type KurikulumFormInput =
  z.input<typeof kurikulumSchema>

export type KurikulumFormValues =
  z.output<typeof kurikulumSchema>