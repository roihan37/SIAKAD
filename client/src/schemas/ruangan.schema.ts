import * as z from "zod"
import {
  requiredText,
  numericValue,
} from "./common.schema"
export const ruanganSchema = z.object({
  kode: requiredText("Kode ruangan", 4, 32),
  nama: requiredText("Nama ruangan", 4, 100),
  kapasitas: numericValue("Kapasitas", 20, 50),
  gedung: requiredText("Gedung", 2, 100),
})

export type RuanganFormInput = z.input<typeof ruanganSchema>
export type RuanganFormValues = z.output<typeof ruanganSchema>