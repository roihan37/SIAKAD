import { useTabRequest } from "@/hooks/use-tab-request"
import { dayLabel } from "@/lib/lecturer-schedule"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAppSelector } from "@/hooks/redux"
import { getLecturerAcademicYears, getLecturerAdvisees, getLecturerSchedule, getLecturerTeach } from "@/features/action/lecturerTabsThunk"
import { clearAdvisees, clearSchedule, clearTeach, clearYears } from "@/features/slice/lecturerTabsSlice"
import { EmptyTab, RemoteTab, TabSkeleton } from "@/components/dosen-detail/remote-tab"
import { ScheduleView } from "@/components/dosen-detail/schedule-view"
import type { AcademicYear, LecturerTabParams } from "@/types/lecturer-tabs"

export type LecturerDataSection = "Mengajar" | "Mahasiswa PA" | "Jadwal"
function yearLabel(year: AcademicYear) { return `${year.tahun} ${dayLabel(year.semester)}` }

export function LecturerDataTabs({ id, section }: { id: string; section: LecturerDataSection }) {
  const years = useAppSelector((state) => state.lecturerTabs.years)
  const retry = useTabRequest<AcademicYear[], undefined>(getLecturerAcademicYears, undefined, clearYears)
  const [selectedYear, setSelectedYear] = useState<number>()
  const available = years.data ?? []
  const year = available.find((item) => item.id === selectedYear) ?? available.find((item) => item.isActive) ?? available[0]
  return <RemoteTab state={years} retry={retry}>{() => !year ? <EmptyTab>Belum ada tahun akademik yang tersedia.</EmptyTab> : <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">{section}</h2><label className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Tahun Akademik</span><select value={year.id} onChange={(event) => setSelectedYear(Number(event.target.value))} className="h-9 rounded-lg border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-ring">{available.map((item) => <option key={item.id} value={item.id}>{yearLabel(item)}</option>)}</select></label></div>
    {section === "Mengajar" && <TeachingTab key={`${id}-${year.id}`} id={id} tahunAkademikId={year.id} />}
    {section === "Jadwal" && <ScheduleTab key={`${id}-${year.id}`} id={id} tahunAkademikId={year.id} />}
    {section === "Mahasiswa PA" && <AdviseesTab key={`${id}-${year.id}`} id={id} tahunAkademikId={year.id} />}
  </div>}</RemoteTab>
}

function TeachingTab({ id, tahunAkademikId }: LecturerTabParams) {
  const params = useMemo(() => ({ id, tahunAkademikId }), [id, tahunAkademikId])
  const state = useAppSelector((store) => store.lecturerTabs.teach)
  const retry = useTabRequest(getLecturerTeach, params, clearTeach)
  return <RemoteTab state={state} retry={retry}>{({ mengajar }) => <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-3">{[{ label: "Total Mata Kuliah", value: new Set(mengajar.map((item) => item.kode)).size }, { label: "Total Kelas", value: new Set(mengajar.map((item) => item.kelas)).size }, { label: "Beban Mengajar", value: `${mengajar.reduce((sum, item) => sum + item.sks, 0)} SKS` }].map((item) => <div key={item.label} className="rounded-xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-2 text-2xl font-semibold">{item.value}</p></div>)}</div>{!mengajar.length ? <EmptyTab>Belum ada mata kuliah yang diampu pada tahun akademik ini.</EmptyTab> : <div className="overflow-hidden rounded-lg border"><Table><TableHeader><TableRow>{["Kode", "Mata Kuliah", "Kelas", "SKS", "Jadwal"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{mengajar.map((item) => <TableRow key={item.id}><TableCell className="font-mono text-xs">{item.kode}</TableCell><TableCell className="font-medium">{item.mataKuliah}</TableCell><TableCell><Badge variant="outline">{item.kelas}</Badge></TableCell><TableCell>{item.sks}</TableCell><TableCell>{item.jadwal.length ? <ul className="space-y-2">{item.jadwal.map((schedule) => <li key={schedule.id}><p>{dayLabel(schedule.hari)}, {schedule.jamMulai}–{schedule.jamSelesai}</p><p className="text-xs text-muted-foreground">{schedule.ruangan} · WIB</p></li>)}</ul> : "Belum dijadwalkan"}</TableCell></TableRow>)}</TableBody></Table></div>}</div>}</RemoteTab>
}

function ScheduleTab({ id, tahunAkademikId }: LecturerTabParams) {
  const params = useMemo(() => ({ id, tahunAkademikId }), [id, tahunAkademikId])
  const state = useAppSelector((store) => store.lecturerTabs.schedule)
  const retry = useTabRequest(getLecturerSchedule, params, clearSchedule)
  return <RemoteTab state={state} retry={retry}>{(data) => <div className="space-y-4"><p className="text-sm text-muted-foreground">Pola jadwal mingguan · seluruh waktu dalam WIB.</p><ScheduleView jadwal={data.jadwal} /></div>}</RemoteTab>
}

const labels: Record<string, string> = { AKTIF: "Aktif", CUTI: "Cuti", NONAKTIF: "Nonaktif", LULUS: "Lulus", DISETUJUI: "Disetujui", MENUNGGU: "Menunggu", BELUM_DIAJUKAN: "Belum KRS", DITOLAK: "Ditolak" }
function Status({ value }: { value: string }) {
  return <Badge variant="secondary" className={value === "AKTIF" || value === "DISETUJUI" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : value === "MENUNGGU" || value === "CUTI" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : value === "DITOLAK" ? "bg-destructive/10 text-destructive" : ""}>{labels[value] ?? value}</Badge>
}

function AdviseesTab({ id, tahunAkademikId }: LecturerTabParams) {
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  useEffect(() => { const timer = window.setTimeout(() => { setSearch(query.trim()); setPage(1) }, 350); return () => window.clearTimeout(timer) }, [query])
  const params = useMemo(() => ({ id, tahunAkademikId, search, page, limit: 10 }), [id, tahunAkademikId, search, page])
  const state = useAppSelector((store) => store.lecturerTabs.advisees)
  const retry = useTabRequest(getLecturerAdvisees, params, clearAdvisees)
  const searching = query.trim() !== search
  return <div className="space-y-5"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Cari NIM atau nama mahasiswa PA" placeholder="Cari NIM atau nama..." value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" /></div>{searching ? <TabSkeleton /> : <RemoteTab state={state} retry={retry}>{({ advisees, summary, pagination }) => <div className="space-y-4"><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>Total bimbingan: {summary.total}</span><span>· Disetujui: {summary.approved}</span><span>· Menunggu: {summary.pending}</span><span>· Belum KRS: {summary.notSubmitted}</span><span>· Ditolak: {summary.rejected}</span></div>{advisees.length ? <div className="overflow-hidden rounded-lg border"><Table><TableHeader><TableRow>{["NIM", "Mahasiswa", "Angkatan", "Status Mhs", "Status KRS"].map((label) => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{advisees.map((student) => <TableRow key={student.id}><TableCell className="font-mono text-xs">{student.nim}</TableCell><TableCell><Link to={`/mahasiswa/${student.id}`} className="font-medium hover:underline">{student.name}</Link><p className="mt-1 text-xs text-muted-foreground">{student.studyProgram.name}</p></TableCell><TableCell>{student.cohort}</TableCell><TableCell><Status value={student.studentStatus} /></TableCell><TableCell><Status value={student.krsStatus} /></TableCell></TableRow>)}</TableBody></Table></div> : <EmptyTab>{search ? "Tidak ada mahasiswa yang cocok dengan pencarian." : "Belum ada mahasiswa bimbingan."}{search && <Button variant="ghost" className="mt-2" onClick={() => setQuery("")}>Reset pencarian</Button>}</EmptyTab>}<div className="flex flex-wrap items-center justify-between gap-3"><p role="status" className="text-xs text-muted-foreground">{pagination.totalRows} mahasiswa · Halaman {pagination.page} dari {Math.max(1, pagination.totalPages)}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Sebelumnya</Button><Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Berikutnya</Button></div></div></div>}</RemoteTab>}</div>
}
