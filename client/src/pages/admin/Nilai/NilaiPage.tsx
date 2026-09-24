import { useEffect, useRef, useState } from "react"
import { Activity, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Download, Search, Users } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { useAppDispatch } from "@/hooks/redux"
import { setAcademicYearId, setStudyProgramId, setClassId, setCourseId, setLecturerId, setStatus, resetFilters, setStudentPage, setCoursePage } from "@/features/slice/gradeSlice"
import type { GradeStatus } from "@/types/grades"
import { StudentDetailDialog, CourseDetailDialog } from "./NilaiDialogs"
import { CourseTable, StudentTable } from "./NilaiTables"
import { GradeSelect } from "./GradeSelect"
import { score, statusLabels } from "./grade-format"
import { exportGrades } from "./grade-export"
import { useGrades } from "./use-grades"
function Feedback({ message, retry }: { message: string; retry: () => void }) { return <div role="alert" className="space-y-3 rounded-xl border p-4"><p className="text-sm text-destructive">{message}</p><Button variant="outline" onClick={retry}>Coba Lagi</Button></div> }
export default function NilaiPage() {
  const dispatch = useAppDispatch()
  const { filters, options, summary, studentGrades, courseGrades, view, setView, search, setSearchInput, pagination, retrySummary, retryTable, retryOptions } = useGrades()
  const [detail, setDetail] = useState<{ studentId: string; assignmentId: number } | null>(null)
  const [courseIdDetail, setCourseIdDetail] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const exportRequest = useRef<AbortController | null>(null)
  useEffect(() => () => exportRequest.current?.abort(), [])
  const handleExport = async () => {
    if (exportRequest.current) return
    const controller = new AbortController(); exportRequest.current = controller; setExporting(true)
    try { await exportGrades(filters, view, controller.signal); toast.success("Rekap nilai berhasil diexport") }
    catch { if (!controller.signal.aborted) toast.error("Export gagal. Silakan coba lagi.") }
    finally { exportRequest.current = null; setExporting(false) }
  }
  const current = view === "students" ? studentGrades : courseGrades
  const total = current.data ? pagination.totalRows : 0
  const currentPage = pagination.page, totalPages = Math.max(1, pagination.totalPages), pageSize = pagination.limit, start = (currentPage - 1) * pageSize
  const numeric = (value: string | undefined) => value ? Number(value) : undefined
  const filterControls = [
    { label: "Prodi", value: filters.studyProgramId, options: options.data?.programs ?? [], onChange: (value: string | undefined) => dispatch(setStudyProgramId(numeric(value))) },
    { label: "Kelas", value: filters.classId, options: options.data?.classes.filter((item) => (!filters.academicYearId || item.academicYearId === filters.academicYearId) && (!filters.studyProgramId || item.studyProgramId === filters.studyProgramId)) ?? [], onChange: (value: string | undefined) => dispatch(setClassId(numeric(value))) },
    { label: "Mata Kuliah", value: filters.courseId, options: options.data?.courses ?? [], onChange: (value: string | undefined) => dispatch(setCourseId(numeric(value))) },
    { label: "Dosen", value: filters.lecturerId, options: options.data?.lecturers ?? [], onChange: (value: string | undefined) => dispatch(setLecturerId(value)) },
    { label: "Status Nilai", value: filters.status, options: Object.entries(statusLabels).map(([id, label]) => ({ id, label })), onChange: (value: string | undefined) => dispatch(setStatus(value as GradeStatus | undefined)) },
  ]
  const cards = [
    { title: "Total Mahasiswa", value: summary.data?.totalStudents ?? "—", caption: "Mahasiswa unik sesuai filter", icon: Users, color: "text-primary bg-primary/10" },
    { title: "Nilai Lengkap", value: summary.data?.completedGrades ?? "—", caption: "Catatan nilai berstatus Final", icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10" },
    { title: "Belum Lengkap", value: summary.data?.incompleteGrades ?? "—", caption: "Termasuk nilai belum diinput", icon: ClipboardList, color: "text-amber-600 bg-amber-500/10" },
    { title: "Rata-rata Nilai", value: score(summary.data?.averageFinalScore), caption: "Dari nilai akhir terisi · Skala 0–100", icon: Activity, color: "text-blue-600 bg-blue-500/10" },
  ]
  return <main className="space-y-6 py-6">
    <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">Nilai</h1></div><p className="mt-1 text-sm text-muted-foreground">Monitor kelengkapan nilai dan kelola koreksi akademik mahasiswa.</p></div><div className="flex flex-wrap items-end gap-3"><div className="min-w-52 flex-1"><GradeSelect label="Tahun Akademik" required value={filters.academicYearId} options={options.data?.years ?? []} disabled={options.loading} onChange={(value) => dispatch(setAcademicYearId(value ? Number(value) : undefined))} /></div><Button variant="outline" className="h-10" disabled={!total || !filters.academicYearId || exporting || current.loading} onClick={handleExport}><Download />{exporting ? "Mengekspor..." : "Export"}</Button></div></header>
    <section aria-label="Filter nilai" className="rounded-xl border bg-card p-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><div className="space-y-1.5 sm:col-span-2 xl:col-span-5"><label htmlFor="grade-search" className="text-xs font-medium text-muted-foreground">Cari Mahasiswa</label><div className="relative"><Search className="pointer-events-none absolute top-3 left-3 size-4 text-muted-foreground" /><Input id="grade-search" className="h-10 pl-9" placeholder="Cari NIM atau nama mahasiswa..." value={search} maxLength={200} onChange={(event) => setSearchInput(event.target.value)} /></div></div>{filterControls.map((control) => <GradeSelect key={control.label} {...control} disabled={options.loading || !options.data} />)}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Ringkasan, rekap, dan export mengikuti seluruh filter aktif.</p><Button size="sm" variant="ghost" disabled={!search && Object.entries(filters).every(([key, value]) => key === "academicYearId" || value === undefined)} onClick={() => { setSearchInput(""); dispatch(resetFilters()) }}>Reset Filter</Button></div></section>
    {options.error && <Feedback message={options.error} retry={retryOptions} />}
    {!options.loading && !filters.academicYearId && <p role="status" className="text-sm text-muted-foreground">Pilih tahun akademik untuk menampilkan nilai.</p>}
    {summary.error && <Feedback message={summary.error} retry={retrySummary} />}
    <section aria-label="Ringkasan nilai" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ title, value, caption, icon: Icon, color }) => <Card key={title} className="shadow-none"><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{title}</p><div className={`rounded-lg p-2 ${color}`}><Icon className="size-4" /></div></div>{summary.loading ? <Skeleton className="mt-3 h-9 w-24" /> : <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>}<p className="mt-1 text-xs text-muted-foreground">{caption}</p></CardContent></Card>)}</section>
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Rekap nilai"><div className="flex flex-col justify-between gap-3 border-b p-4 sm:flex-row sm:items-center"><div role="group" aria-label="Tampilan rekap nilai" className="flex w-fit max-w-full gap-1 rounded-lg bg-muted p-1">{([["students", "Rekap Mahasiswa"], ["courses", "Rekap Mata Kuliah"]] as const).map(([value, label]) => <Button key={value} variant={view === value ? "outline" : "ghost"} size="sm" className="text-xs sm:text-sm" aria-pressed={view === value} onClick={() => { setView(value) }}>{label}</Button>)}</div><p className="text-xs text-muted-foreground" aria-live="polite">{total} {view === "students" ? "catatan nilai" : "mata kuliah–kelas"}</p></div>
      {current.error ? <Feedback message={current.error} retry={retryTable} /> : view === "students" ? <StudentTable rows={studentGrades.data ?? []} loading={current.loading} onDetail={(row) => { if (row.kelasMataKuliahId) setDetail({ studentId: row.student.id, assignmentId: row.kelasMataKuliahId }) }} /> : <CourseTable rows={courseGrades.data ?? []} loading={current.loading} onDetail={(row) => setCourseIdDetail(row.kelasMataKuliahId)} />}

      <nav aria-label="Pagination nilai" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><p className="text-xs text-muted-foreground">Menampilkan {total ? start + 1 : 0}–{Math.min(start + pageSize, total)} dari {total}</p><div className="flex items-center gap-3"><Button variant="outline" size="icon" aria-label="Halaman sebelumnya" disabled={current.loading || currentPage === 1} onClick={() => dispatch(view === "students" ? setStudentPage(currentPage - 1) : setCoursePage(currentPage - 1))}><ChevronLeft /></Button><span className="text-xs">Halaman {currentPage} dari {totalPages}</span><Button variant="outline" size="icon" aria-label="Halaman berikutnya" disabled={current.loading || currentPage >= totalPages} onClick={() => dispatch(view === "students" ? setStudentPage(currentPage + 1) : setCoursePage(currentPage + 1))}><ChevronRight /></Button></div></nav>
    </section>
    {detail && <StudentDetailDialog {...detail} onClose={() => setDetail(null)} />}
    {courseIdDetail && filters.academicYearId && <CourseDetailDialog assignmentId={courseIdDetail} academicYearId={filters.academicYearId} onClose={() => setCourseIdDetail(null)} onStudent={(studentId) => { setDetail({ studentId, assignmentId: courseIdDetail }); setCourseIdDetail(null) }} />}
  </main>
}
