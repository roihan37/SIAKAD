import type { MasterField, MasterRecord } from "./master-api"

export function buildMasterPayload(fields: MasterField[], values: Record<string, string>) {
  const errors: Record<string, string> = {}
  const payload: MasterRecord = {}
  for (const field of fields) {
    const value = (values[field.key] ?? "").trim()
    if (!value) {
      if (!field.optional) errors[field.key] = `${field.label} wajib diisi`
      else payload[field.key] = null
      continue
    }
    if (field.choices && !field.choices.some(([option]) => option === value)) errors[field.key] = `${field.label} tidak valid`
    if (field.type === "time" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) errors[field.key] = "Gunakan format HH:mm"
    if (field.type === "boolean") {
      if (!["true", "false"].includes(value)) errors[field.key] = `${field.label} tidak valid`
      else payload[field.key] = value === "true"
    } else if (field.type === "number" || field.options) {
      const number = Number(value)
      if (!Number.isSafeInteger(number) || number < (field.min ?? 1) || number > (field.max ?? Number.MAX_SAFE_INTEGER)) errors[field.key] = `${field.label} tidak valid`
      else payload[field.key] = number
    } else {
      if (field.type === "semester" && !["GANJIL", "GENAP"].includes(value)) errors[field.key] = "Semester tidak valid"
      if (field.type === "yearRange" && (!/^\d{4}\/\d{4}$/.test(value) || Number(value.slice(5)) !== Number(value.slice(0, 4)) + 1)) errors[field.key] = "Gunakan tahun berurutan, misalnya 2026/2027"
      payload[field.key] = value
    }
  }
  if (values.jamMulai && values.jamSelesai && values.jamMulai >= values.jamSelesai) errors.jamSelesai = "Jam selesai harus setelah jam mulai"
  return { errors, payload }
}
