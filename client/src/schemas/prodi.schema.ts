import * as z from "zod"
import {
  requiredText,
  positiveId,
} from "./common.schema"

export const prodiSchema = z.object({
  kode: requiredText("Kode program studi", 2, 32),

  name: requiredText(
    "Nama program studi",
    3,
    100,
  ),

  fakultasId: positiveId(
    "Fakultas induk",
  ),
})

export type ProdiFormValues =
  z.input<typeof prodiSchema>

export type ProdiFromInput =
  z.output<typeof prodiSchema>