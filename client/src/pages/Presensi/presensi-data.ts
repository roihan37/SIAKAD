export const statuses = ["Hadir", "Izin", "Sakit", "Alpa"] as const
export type AttendanceStatus = typeof statuses[number]
export type Attendance = {
  id: string; studentId: string; nim: string; name: string; period: string
  prodi: string; kelas: string; course: string; lecturer: string
  meeting: number; date: string; status: AttendanceStatus; reason?: string
}
export const periods = ["2026/2027 Ganjil", "2025/2026 Genap"]
const names = ["Andi Pratama", "Budi Saputra", "Citra Lestari", "Dewi Anggraini", "Eka Putra", "Farah Aulia", "Gilang Ramadhan", "Hana Safitri", "Indra Maulana", "Jihan Putri", "Kevin Aditya", "Laras Wulandari", "Muhammad Rizki", "Nadia Zahra", "Oki Firmansyah", "Putri Amanda", "Rafi Alamsyah", "Salsa Nabila"]
const groups = [
  { prodi: "Teknik Informatika", kelas: "TI-3A", course: "Basis Data", lecturer: "Budi Santoso" },
  { prodi: "Teknik Informatika", kelas: "TI-3B", course: "Pemrograman Web", lecturer: "Rina Amelia" },
  { prodi: "Sistem Informasi", kelas: "SI-3A", course: "Analisis Sistem", lecturer: "Ahmad Fauzi" },
]
export function createAttendance(): Attendance[] {
  return periods.flatMap((period, p) => names.flatMap((name, i) => Array.from({ length: 8 }, (_, m) => ({
    id: `${p}-${i}-${m}`, studentId: `student-${i}`, nim: `2024${String(i + 1).padStart(4, "0")}`, name, period,
    ...groups[Math.floor(i / 6)], meeting: m + 1,
    date: new Date(Date.UTC(2026, p === 0 ? 7 : 1, 3 + m * 7)).toISOString().slice(0, 10),
    status: (i + m + p) % 11 === 0 ? "Alpa" : (i + m) % 9 === 0 ? "Sakit" : (i + m) % 7 === 0 ? "Izin" : "Hadir",
  }))))
}
export function summarize(records: Attendance[]) {
  const counts = { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 }
  records.forEach((row) => counts[row.status]++)
  return { ...counts, rate: records.length ? counts.Hadir / records.length * 100 : 0 }
}
export type Recap = { id: string; records: Attendance[] }
export function groupAttendance(records: Attendance[], view: "students" | "meetings"): Recap[] {
  const groups = new Map<string, Attendance[]>()
  records.forEach((row) => {
    const key = view === "students" ? `${row.studentId}-${row.kelas}` : `${row.period}-${row.kelas}-${row.course}-${row.meeting}`
    groups.set(key, [...(groups.get(key) ?? []), row])
  })
  return Array.from(groups, ([id, records]) => ({ id, records }))
}
export const formatDate = (date: string) => new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date))
export const formatRate = (rate: number) => `${rate.toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`

export function exportAttendance(rows: Recap[], view: "students" | "meetings") {
  const header = view === "students" ? ["NIM", "Mahasiswa", "Kelas", "Hadir", "Izin", "Sakit", "Alpa", "Kehadiran"] : ["Pertemuan", "Tanggal", "Kelas", "Mata Kuliah", "Hadir", "Izin", "Sakit", "Alpa"]
  const data = rows.map(({ records }) => {
    const row = records[0], counts = summarize(records)
    return view === "students" ? [row.nim, row.name, row.kelas, counts.Hadir, counts.Izin, counts.Sakit, counts.Alpa, formatRate(counts.rate)] : [row.meeting, row.date, row.kelas, row.course, counts.Hadir, counts.Izin, counts.Sakit, counts.Alpa]
  })
  const csv = [header, ...data].map((cells) => cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
  const anchor = document.createElement("a")
  anchor.href = url; anchor.download = `presensi-${view}.csv`; anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
