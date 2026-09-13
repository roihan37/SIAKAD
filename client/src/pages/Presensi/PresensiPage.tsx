import { useAttendance } from "./use-attendance"
import { useState } from "react"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAppDispatch } from "@/hooks/redux"
import { setAttendancePage, setAttendanceQuery, setAttendanceView } from "@/features/slice/attendanceSlice"
import type { AttendanceOptions, AttendanceQuery, AttendanceStudent } from "@/types/attendance"
import { PresensiTable } from "./PresensiTable"
import { MeetingAttendanceDialog, StudentAttendanceDialog } from "./PresensiDialogs"

const fields: [keyof AttendanceOptions, keyof AttendanceQuery, string][] = [["academicYears", "tahunAkademikId", "Tahun Akademik"], ["studyPrograms", "prodiId", "Prodi"], ["classes", "kelasId", "Kelas"], ["courses", "mataKuliahId", "Mata Kuliah"], ["lecturers", "dosenId", "Dosen"]]
export default function PresensiPage() {
  const dispatch = useAppDispatch()
  const { query, page, view, summary, students, meetings, filters, search, setSearch, reload } = useAttendance()
  const [student, setStudent] = useState<AttendanceStudent | null>(null)
  const [meeting, setMeeting] = useState<string | null>(null)
  const current = view === "students" ? students : meetings
  const pagination = current.data?.pagination
  const totalPages = Math.max(1, pagination?.totalPages ?? 1)
  const cards = [["Rata-rata Kehadiran", summary.data ? `${summary.data.averageAttendance}%` : "—"], ["Hadir", summary.data?.present ?? "—"], ["Izin/Sakit", summary.data ? summary.data.permission + summary.data.sick : "—"], ["Alpa", summary.data?.absent ?? "—"]]
  return <main className="space-y-6 py-6"><header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Presensi</h1><p className="mt-1 text-sm text-muted-foreground">Pantau kehadiran mahasiswa dan rekap pertemuan perkuliahan.</p></div><Button variant="outline" onClick={reload} disabled={current.loading || summary.loading}><RefreshCw />Muat Ulang</Button></header>
    <section className="space-y-4 rounded-xl border bg-card p-4" aria-label="Filter presensi"><div><label htmlFor="attendance-search" className="text-xs font-medium">Cari presensi</label><Input id="attendance-search" maxLength={200} className="mt-2" placeholder="NIM, nama, mata kuliah, dosen, atau topik..." value={search} onChange={(event) => setSearch(event.target.value)} /><p className="mt-2 text-xs text-muted-foreground">Pencarian menampilkan pertemuan yang cocok beserta seluruh pesertanya.</p></div>{filters.error ? <div role="alert" className="text-sm text-destructive">{filters.error} <Button variant="outline" onClick={reload}>Coba Lagi</Button></div> : filters.loading ? <Skeleton className="h-16" /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{fields.map(([key, param, label]) => <div key={key} className="space-y-2"><label htmlFor={`attendance-${key}`} className="text-xs font-medium">{label}</label><Select value={String(query[param] ?? "all")} onValueChange={(value) => { if (value) dispatch(setAttendanceQuery({ ...query, [param]: value === "all" ? undefined : param === "dosenId" ? value : Number(value) })) }}><SelectTrigger id={`attendance-${key}`} className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Semua {label}</SelectItem>{filters.data?.[key].map((option) => <SelectItem key={option.id} value={String(option.id)}>{option.name ?? `${option.year} ${option.semester}`}</SelectItem>)}</SelectContent></Select></div>)}</div>}<Button size="sm" variant="ghost" onClick={() => { setSearch(""); dispatch(setAttendanceQuery({})) }}>Reset Filter</Button></section>
    {summary.error ? <div role="alert" className="text-sm text-destructive">{summary.error} <Button onClick={reload}>Coba Lagi</Button></div> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p>{summary.loading ? <Skeleton className="mt-3 h-9" /> : <p className="mt-3 text-3xl font-semibold tabular-nums">{value}</p>}</div>)}</section>}
    <section className="overflow-hidden rounded-xl border bg-card"><div className="flex flex-wrap gap-2 border-b p-4" role="group" aria-label="Tampilan rekap">{([["students", "Rekap Mahasiswa"], ["meetings", "Rekap Pertemuan"]] as const).map(([value, label]) => <Button key={value} variant={view === value ? "secondary" : "ghost"} aria-pressed={view === value} onClick={() => dispatch(setAttendanceView(value))}>{label}</Button>)}</div>{current.loading ? <div role="status" aria-label="Memuat presensi" className="space-y-3 p-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div> : current.error ? <div role="alert" className="space-y-3 p-5"><p>{current.error}</p><Button onClick={reload}>Coba Lagi</Button></div> : <PresensiTable students={students.data?.students ?? []} meetings={meetings.data?.meetings ?? []} view={view} onStudent={setStudent} onMeeting={setMeeting} />}
      <nav aria-label="Pagination presensi" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><span className="text-xs text-muted-foreground">{pagination?.totalRows ?? 0} hasil · Halaman {page} dari {totalPages}</span><div className="flex gap-2"><Button size="icon" variant="outline" aria-label="Halaman sebelumnya" disabled={current.loading || page <= 1} onClick={() => dispatch(setAttendancePage(page - 1))}><ChevronLeft /></Button><Button size="icon" variant="outline" aria-label="Halaman berikutnya" disabled={current.loading || page >= totalPages} onClick={() => dispatch(setAttendancePage(page + 1))}><ChevronRight /></Button></div></nav>
    </section>{student && <StudentAttendanceDialog row={student} onClose={() => setStudent(null)} />}{meeting && <MeetingAttendanceDialog id={meeting} onClose={() => setMeeting(null)} />}
  </main>
}
