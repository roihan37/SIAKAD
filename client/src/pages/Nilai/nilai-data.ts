export const periods = ["2026/2027 Ganjil", "2025/2026 Genap"]
export const statuses = ["Final", "Belum Lengkap", "Belum Diinput"] as const
export type GradeStatus = typeof statuses[number]
export type Correction = { before: number | null; after: number; reason: string; date: string }
export type GradeRecord = {
  id: string; studentId: string; nim: string; name: string; period: string
  prodi: string; kelas: string; code: string; course: string; lecturer: string
  tugas: number | null; uts: number | null; uas: number | null
  final: number | null; status: GradeStatus; history: Correction[]
}
export type CourseRecap = { id: string; records: GradeRecord[] }
export const grade = (value: number | null) => value === null ? "—" : value >= 85 ? "A" : value >= 75 ? "B" : value >= 65 ? "C" : value >= 50 ? "D" : "E"
export const score = (value: number | null) => value === null ? "—" : value.toLocaleString("id-ID", { maximumFractionDigits: 2 })
export function createGrades(): GradeRecord[] {
  const names = ["Andi Pratama", "Budi Saputra", "Citra Lestari", "Dewi Anggraini", "Eka Putra", "Farah Aulia", "Gilang Ramadhan", "Hana Safitri", "Indra Maulana", "Jihan Putri", "Kevin Aditya", "Laras Wulandari", "Muhammad Rizki", "Nadia Zahra", "Oki Firmansyah", "Putri Amanda", "Rafi Alamsyah", "Salsa Nabila"]
  const courses = [
    { code: "IF301", course: "Basis Data", lecturer: "Budi Santoso" },
    { code: "IF302", course: "Pemrograman Web", lecturer: "Rina Amelia" },
    { code: "IF303", course: "Struktur Data", lecturer: "Dedi Rahman" },
    { code: "IF304", course: "Sistem Operasi", lecturer: "Ahmad Fauzi" },
  ]
  return periods.flatMap((period, p) => names.flatMap((name, i) => courses.map((course, c) => {
    const seed = i + c * 3 + p
    const status: GradeStatus = seed % 7 === 0 ? "Belum Diinput" : seed % 5 === 0 ? "Belum Lengkap" : "Final"
    const tugas = status === "Belum Diinput" ? null : 60 + seed % 36
    const uts = status === "Belum Diinput" ? null : 55 + seed % 41
    const uas = status === "Final" ? 58 + seed % 39 : null
    return { id: `${p}-${i}-${c}`, studentId: `student-${i}`, nim: `2024${String(i + 1).padStart(4, "0")}`, name, period,
      prodi: i < 12 ? "Teknik Informatika" : "Sistem Informasi", kelas: i < 6 ? "TI-3A" : i < 12 ? "TI-3B" : "SI-3A", ...course,
      tugas, uts, uas, final: status === "Final" ? Math.round(tugas! * 0.3 + uts! * 0.3 + uas! * 0.4) : null, status, history: [],
    }
  })))
}
export function summarizeGrades(records: GradeRecord[]) {
  const filled = records.filter((row) => row.final !== null)
  return { students: new Set(records.map((row) => row.studentId)).size, complete: records.filter((row) => row.status === "Final").length,
    incomplete: records.filter((row) => row.status !== "Final").length, filled: filled.length,
    average: filled.length ? filled.reduce((sum, row) => sum + row.final!, 0) / filled.length : null }
}
export function groupCourses(records: GradeRecord[]): CourseRecap[] {
  const grouped = new Map<string, GradeRecord[]>()
  records.forEach((row) => { const key = `${row.period}-${row.code}-${row.kelas}`; grouped.set(key, [...(grouped.get(key) ?? []), row]) })
  return Array.from(grouped, ([id, records]) => ({ id, records }))
}
export function courseStatus(records: GradeRecord[]): GradeStatus {
  if (records.every((row) => row.status === "Final")) return "Final"
  return records.every((row) => row.status === "Belum Diinput") ? "Belum Diinput" : "Belum Lengkap"
}
export function correctGrade(row: GradeRecord, next: number, reason: string, date: string): GradeRecord {
  return { ...row, final: next, status: "Final", history: [...row.history, { before: row.final, after: next, reason, date }] }
}
export function exportGrades(records: GradeRecord[], view: "students" | "courses") {
  const headers = view === "students" ? ["NIM", "Mahasiswa", "Kelas", "Mata Kuliah", "Nilai Akhir", "Grade", "Status"] : ["Kode", "Mata Kuliah", "Kelas", "Dosen", "Jumlah Mahasiswa", "Nilai Terisi", "Rata-rata", "Status"]
  const rows = view === "students" ? records.map((row) => [row.nim, row.name, row.kelas, row.course, score(row.final), grade(row.final), row.status]) : groupCourses(records).map(({ records }) => {
    const row = records[0], summary = summarizeGrades(records)
    return [row.code, row.course, row.kelas, row.lecturer, summary.students, summary.filled, score(summary.average), courseStatus(records)]
  })
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
  const link = document.createElement("a"); link.href = url; link.download = `nilai-${view}.csv`; link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
