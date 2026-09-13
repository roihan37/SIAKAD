import { api } from "@/api/axios"
import { isAxiosError } from "axios"
export type MasterModule = "prodi" | "mata-kuliah" | "ruangan" | "tahun-akademik" | "kurikulum" | "jadwal" | "krs"
export type MasterRecord = Record<string, string | number | boolean | null>
export type MasterField = { key: string; label: string; type?: "number" | "boolean" | "semester" | "yearRange" | "time"; choices?: [string, string][]; optional?: boolean; min?: number; max?: number; options?: "fakultas" | "prodi" | "ruangan" | "tahun-akademik" }
export type MasterOption = { id: number; name: string }
export const masterError = (error: unknown) => isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? "Tidak dapat menghubungi server. Silakan coba lagi." : "Terjadi kesalahan. Silakan coba lagi."
export const masterApi = {
  async detail(module: MasterModule, id: string | number, signal: AbortSignal) { return (await api.get<MasterRecord>(`/${module}/${encodeURIComponent(id)}`, { signal })).data },
  async update(module: MasterModule, id: string | number, payload: MasterRecord) { await api.patch(`/${module}/${encodeURIComponent(id)}`, payload) },
  async remove(module: MasterModule, id: string | number) { await api.delete(`/${module}/${encodeURIComponent(id)}`) },
  async options(kind: NonNullable<MasterField["options"]>, signal: AbortSignal) {
    const result: MasterOption[] = []
    let page = 1
    let totalPages: number
    do {
      const { data } = await api.get(`/${kind}`, { signal, params: { page, limit: 100, sortBy: "name", sortOrder: "asc" } })
      const rows = data[kind === "tahun-akademik" ? "tahunAkademik" : kind] ?? []
      result.push(...rows.map((row: { id: number; name?: string; nama?: string; kode?: string; tahun?: string; semester?: string }) => ({ id: row.id, name: kind === "tahun-akademik" ? `${row.tahun} ${row.semester}` : row.name ?? `${row.kode} — ${row.nama}` }))); totalPages = data.pagination?.totalPages ?? 1; page++
    } while (page <= totalPages)
    return result
  },
}
