import type { GradeStatus } from "@/types/grades"
export const statusLabels: Record<GradeStatus, string> = { BELUM_DIINPUT: "Belum Diinput", BELUM_LENGKAP: "Belum Lengkap", FINAL: "Final" }
export const score = (value: number | null | undefined) => value == null ? "—" : value.toLocaleString("id-ID", { maximumFractionDigits: 2 })
