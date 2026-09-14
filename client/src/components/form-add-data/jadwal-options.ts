import { api } from "@/api/axios"
import { masterApi } from "@/components/master-data/master-api"
import { getDashboardYears } from "@/api/dashboard"
type Assignment = { id: number; kelasId: number; mataKuliahId: number; dosenId: string }
type Class = { id: number; nama: string; tahunAkademikId: number }
type Course = { id: number; kode: string; nama: string }
type Lecturer = { name: string; dosen: { id: string } }
async function list<T>(path: string, key: string, signal: AbortSignal): Promise<T[]> {
  const rows: T[] = []
  for (let page = 1, pages = 1; page <= pages; page++) {
    const { data } = await api.get<Record<string, T[]> & { pagination?: { totalPages: number } }>(path, { params: { page, limit: 100 }, signal })
    rows.push(...data[key]); pages = data.pagination?.totalPages ?? 1
  }
  return rows
}
export async function loadJadwalOptions(signal: AbortSignal) {
  const [years, rooms, assignments, classes, courses, lecturers] = await Promise.all([
    getDashboardYears(signal), masterApi.options("ruangan", signal),
    list<Assignment>("/kelas-mata-kuliah", "kelasMataKuliah", signal), list<Class>("/kelas", "kelas", signal),
    list<Course>("/mata-kuliah", "mataKuliah", signal), list<Lecturer>("/lecturers", "lecturers", signal),
  ])
  return { years, rooms, assignments: assignments.flatMap((assignment) => {
    const kelas = classes.find((row) => row.id === assignment.kelasId)
    const course = courses.find((row) => row.id === assignment.mataKuliahId)
    const lecturer = lecturers.find((row) => row.dosen.id === assignment.dosenId)
    return kelas && course && lecturer ? [{ id: assignment.id, yearId: kelas.tahunAkademikId, label: `${kelas.nama} · ${course.kode} — ${course.nama}`, lecturer: lecturer.name }] : []
  }) }
}
