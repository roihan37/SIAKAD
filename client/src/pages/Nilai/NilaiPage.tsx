import { useMemo, useState } from "react"
import { Activity, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Download, Search, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { AcademicSelect } from "@/components/academic/AcademicSelect"
import { CorrectionDialog, StudentDetailDialog } from "./NilaiDialogs"
import { CourseDetailDialog, CourseTable, StudentTable } from "./NilaiTables"
import { correctGrade, createGrades, exportGrades, groupCourses, periods, score, statuses, summarizeGrades, type CourseRecap } from "./nilai-data"

type View = "students" | "courses"
type FilterKey = "prodi" | "kelas" | "course" | "lecturer" | "status"
const emptyFilters: Record<FilterKey, string> = { prodi: "Semua", kelas: "Semua", course: "Semua", lecturer: "Semua", status: "Semua" }
const filterLabels: [FilterKey, string][] = [["prodi", "Prodi"], ["kelas", "Kelas"], ["course", "Mata Kuliah"], ["lecturer", "Dosen"], ["status", "Status Nilai"]]
const pageSize = 10

export default function NilaiPage() {
  const [records, setRecords] = useState(createGrades)
  const [period, setPeriod] = useState(periods[0])
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState(emptyFilters)
  const [view, setView] = useState<View>("students")
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [correctionId, setCorrectionId] = useState<string | null>(null)
  const [courseDetail, setCourseDetail] = useState<CourseRecap | null>(null)
  const filtered = useMemo(() => records.filter((row) => row.period === period && `${row.nim} ${row.name}`.toLowerCase().includes(search.trim().toLowerCase()) && filterLabels.every(([key]) => filters[key] === "Semua" || filters[key] === row[key])), [records, period, search, filters])
  const courses = useMemo(() => groupCourses(filtered), [filtered])
  const summary = summarizeGrades(filtered)
  const total = view === "students" ? filtered.length : courses.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const detail = records.find((row) => row.id === detailId)
  const correction = records.find((row) => row.id === correctionId)
  const cards = [
    { title: "Total Mahasiswa", value: summary.students, caption: "Mahasiswa unik sesuai filter", icon: Users, color: "text-primary bg-primary/10" },
    { title: "Nilai Lengkap", value: summary.complete, caption: "Catatan nilai berstatus Final", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10" },
    { title: "Belum Lengkap", value: summary.incomplete, caption: "Termasuk nilai belum diinput", icon: ClipboardList, color: "text-amber-600 bg-amber-500/10" },
    { title: "Rata-rata Nilai", value: score(summary.average), caption: "Dari nilai akhir terisi · Skala 0–100", icon: Activity, color: "text-blue-600 bg-blue-500/10" },
  ]
  return <main className="space-y-6 py-6">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">Nilai</h1><Badge variant="secondary">Demo</Badge></div><p className="mt-1 text-sm text-muted-foreground">Monitor kelengkapan nilai dan kelola koreksi akademik mahasiswa.</p></div><div className="flex flex-wrap items-end gap-3"><div className="min-w-52 flex-1"><AcademicSelect label="Tahun Akademik" value={period} options={periods} onChange={(value) => { setPeriod(value); setFilters(emptyFilters); setPage(1) }} /></div><Button variant="outline" className="h-10" disabled={!total} onClick={() => { exportGrades(filtered, view); toast.success("Rekap nilai berhasil diexport") }}><Download />Export</Button></div></header>
    <section aria-label="Filter nilai" className="rounded-xl border bg-card p-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><div className="space-y-1.5 sm:col-span-2 xl:col-span-5"><label htmlFor="grade-search" className="text-xs font-medium text-muted-foreground">Cari Mahasiswa</label><div className="relative"><Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" /><Input id="grade-search" className="h-10 pl-9" placeholder="Cari NIM atau nama mahasiswa..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></div></div>{filterLabels.map(([key, label]) => <AcademicSelect key={key} label={label} value={filters[key]} options={["Semua", ...(key === "status" ? statuses : new Set(records.filter((row) => row.period === period).map((row) => row[key])))]} onChange={(value) => { setFilters({ ...filters, [key]: value }); setPage(1) }} />)}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Ringkasan, rekap, dan export mengikuti seluruh filter aktif.</p><Button size="sm" variant="ghost" disabled={!search && Object.values(filters).every((value) => value === "Semua")} onClick={() => { setSearch(""); setFilters(emptyFilters); setPage(1) }}>Reset Filter</Button></div></section>
    <section aria-label="Ringkasan nilai" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ title, value, caption, icon: Icon, color }) => <Card key={title} className="shadow-none"><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{title}</p><div className={`rounded-lg p-2 ${color}`}><Icon className="size-4" /></div></div><p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs text-muted-foreground">{caption}</p></CardContent></Card>)}</section>
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Rekap nilai"><div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center"><div role="group" aria-label="Tampilan rekap nilai" className="flex w-fit max-w-full gap-1 rounded-lg bg-muted p-1">{([["students", "Rekap Mahasiswa"], ["courses", "Rekap Mata Kuliah"]] as const).map(([value, label]) => <Button key={value} variant={view === value ? "outline" : "ghost"} size="sm" className="text-xs sm:text-sm" aria-pressed={view === value} onClick={() => { setView(value); setPage(1) }}>{label}</Button>)}</div><p className="text-xs text-muted-foreground" aria-live="polite">{total} {view === "students" ? "catatan nilai" : "mata kuliah–kelas"}</p></div>
      {view === "students" ? <StudentTable rows={filtered.slice(start, start + pageSize)} onDetail={(row) => setDetailId(row.id)} onCorrect={(row) => setCorrectionId(row.id)} /> : <CourseTable rows={courses.slice(start, start + pageSize)} onDetail={setCourseDetail} />}
      <nav aria-label="Pagination nilai" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><p className="text-xs text-muted-foreground">Menampilkan {total ? start + 1 : 0}–{Math.min(start + pageSize, total)} dari {total}</p><div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button><span className="text-xs">Halaman {currentPage} dari {totalPages}</span><Button variant="outline" size="icon" aria-label="Halaman berikutnya" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button></div></nav>
    </section>
    <p className="text-xs text-muted-foreground">Data dummy untuk pratinjau admin. Perubahan dan riwayat koreksi direset saat halaman dimuat ulang.</p>
    {detail && <StudentDetailDialog row={detail} onClose={() => setDetailId(null)} />}
    {courseDetail && <CourseDetailDialog group={courseDetail} onClose={() => setCourseDetail(null)} />}
    {correction && <CorrectionDialog key={correction.id} row={correction} onClose={() => setCorrectionId(null)} onSave={(value, reason) => {
      setRecords((previous) => previous.map((row) => row.id === correction.id ? correctGrade(row, value, reason, new Date().toISOString()) : row))
      setCorrectionId(null)
      toast.success("Koreksi nilai berhasil disimpan pada data demo")
    }} />}
  </main>
}
