import * as z from "zod"
import { requiredText } from "./common.schema"

export const fakultasSchema = z.object({
  kode: requiredText("Kode fakultas", 2, 32),
  name: requiredText("Nama fakultas", 3, 100),
})

export type FakultasFormValues =
  z.infer<typeof fakultasSchema>

export type FakultasFormInput =
  z.infer<typeof fakultasSchema>