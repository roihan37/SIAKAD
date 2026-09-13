import { useMemo, useState } from "react"
import { Activity, CheckCircle2, ChevronLeft, ChevronRight, Download, Search, Stethoscope, UserX } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PresensiSelect } from "./PresensiSelect"
import { PresensiTable } from "./PresensiTable"
import { AttendanceDetailDialog, CorrectionDialog } from "./PresensiDialogs"
import { createAttendance, exportAttendance, formatRate, groupAttendance, periods, summarize, type Attendance } from "./presensi-data"

type View = "students" | "meetings"
type FilterKey = "prodi" | "kelas" | "course" | "lecturer"
const emptyFilters = { prodi: "Semua", kelas: "Semua", course: "Semua", lecturer: "Semua" }
const filterLabels: [FilterKey, string][] = [["prodi", "Prodi"], ["kelas", "Kelas"], ["course", "Mata Kuliah"], ["lecturer", "Dosen"]]
const pageSize = 10

export default function PresensiPage() {
  const [records, setRecords] = useState(createAttendance)
  const [period, setPeriod] = useState(periods[0])
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState(emptyFilters)
  const [view, setView] = useState<View>("students")
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<Attendance[] | null>(null)
  const [correction, setCorrection] = useState<Attendance[] | null>(null)
  const filtered = useMemo(() => records.filter((row) => row.period === period &&
    `${row.nim} ${row.name}`.toLowerCase().includes(search.trim().toLowerCase()) &&
    filterLabels.every(([key]) => filters[key] === "Semua" || filters[key] === row[key])), [records, period, search, filters])
  const rows = useMemo(() => groupAttendance(filtered, view), [filtered, view])
  const summary = summarize(filtered)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const displayed = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const cards = [
    { title: "Rata-rata Kehadiran", value: formatRate(summary.rate), caption: "Hadir ÷ total catatan presensi", icon: Activity, color: "text-primary bg-primary/10" },
    { title: "Hadir", value: summary.Hadir, caption: "Catatan kehadiran mahasiswa", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10" },
    { title: "Izin/Sakit", value: summary.Izin + summary.Sakit, caption: `${summary.Izin} izin · ${summary.Sakit} sakit`, icon: Stethoscope, color: "text-blue-600 bg-blue-500/10" },
    { title: "Alpa", value: summary.Alpa, caption: "Tidak hadir tanpa keterangan", icon: UserX, color: "text-rose-600 bg-rose-500/10" },
  ]
  return <main className="space-y-6 py-6">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">Presensi</h1><Badge variant="secondary">Demo</Badge></div><p className="mt-1 text-sm text-muted-foreground">Pantau kehadiran mahasiswa dan kelola koreksi presensi perkuliahan.</p></div>
      <div className="flex flex-wrap items-end gap-3"><div className="min-w-52 flex-1"><PresensiSelect label="Tahun Akademik" value={period} options={periods} onChange={(value) => { setPeriod(value); setPage(1); setFilters(emptyFilters) }} /></div><Button variant="outline" className="h-10" disabled={!rows.length} onClick={() => { exportAttendance(rows, view); toast.success("Rekap presensi berhasil diexport") }}><Download />Export</Button></div>
    </header>
    <section aria-label="Filter presensi" className="rounded-xl border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><div className="space-y-1.5 sm:col-span-2"><label htmlFor="attendance-search" className="text-xs font-medium text-muted-foreground">Cari Mahasiswa</label><div className="relative"><Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" /><Input id="attendance-search" className="h-10 pl-9" placeholder="Cari NIM atau nama..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div></div>
        {filterLabels.map(([key, label]) => <PresensiSelect key={key} label={label} value={filters[key]} options={["Semua", ...new Set(records.filter((row) => row.period === period).map((row) => row[key]))]} onChange={(value) => { setFilters({ ...filters, [key]: value }); setPage(1) }} />)}
      </div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Ringkasan dan kedua rekap mengikuti filter yang dipilih.</p><Button variant="ghost" size="sm" disabled={!search && Object.values(filters).every((value) => value === "Semua")} onClick={() => { setSearch(""); setFilters(emptyFilters); setPage(1) }}>Reset Filter</Button></div>
    </section>
    <section aria-label="Ringkasan presensi" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ title, value, caption, icon: Icon, color }) => <Card key={title} className="shadow-none"><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{title}</p><div className={`rounded-lg p-2 ${color}`}><Icon className="size-4" /></div></div><p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{caption}</p></CardContent></Card>)}</section>
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Rekap presensi">
      <div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center"><div role="group" aria-label="Tampilan rekap" className="flex w-fit max-w-full gap-1 rounded-lg bg-muted p-1">{([["students", "Rekap Mahasiswa"], ["meetings", "Rekap Pertemuan"]] as const).map(([value, label]) => <Button key={value} size="sm" variant={view === value ? "outline" : "ghost"} aria-pressed={view === value} className="text-xs sm:text-sm" onClick={() => { setView(value); setPage(1) }}>{label}</Button>)}</div><p className="text-xs text-muted-foreground" aria-live="polite">{rows.length} {view === "students" ? "mahasiswa" : "pertemuan"}</p></div>
      <PresensiTable rows={displayed} view={view} onDetail={setDetail} onCorrect={setCorrection} />
      <nav aria-label="Pagination presensi" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><p className="text-xs text-muted-foreground">Menampilkan {rows.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, rows.length)} dari {rows.length}</p><div className="flex items-center gap-3"><Button size="icon" variant="outline" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button><span className="text-xs">Halaman {currentPage} dari {totalPages}</span><Button size="icon" variant="outline" aria-label="Halaman berikutnya" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button></div></nav>
    </section>
    <p className="text-xs text-muted-foreground">Data dummy untuk pratinjau. Koreksi akan kembali ke data awal saat halaman dimuat ulang.</p>
    {detail && <AttendanceDetailDialog records={detail} view={view} onClose={() => setDetail(null)} />}
    {correction && <CorrectionDialog records={correction} onClose={() => setCorrection(null)} onSave={(id, status, reason) => {
      setRecords((previous) => previous.map((row) => row.id === id ? { ...row, status, reason } : row))
      setCorrection(null)
      toast.success("Koreksi presensi berhasil disimpan pada data demo")
    }} />}
  </main>
}
