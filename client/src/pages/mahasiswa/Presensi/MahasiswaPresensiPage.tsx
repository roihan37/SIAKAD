import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  GraduationCap,
  RefreshCw,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react"
import { getMyAttendance, studentAttendanceErrorMessage } from "@/api/student-attendance"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  StudentAttendanceCourse,
  StudentAttendanceStatus,
  StudentMyAttendanceResponse,
} from "@/types/student-my-attendance"

const statuses: StudentAttendanceStatus[] = ["HADIR", "IZIN", "SAKIT", "ALPHA"]
const statusLabels: Record<StudentAttendanceStatus, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
  ALPHA: "Alpa",
}
const statusStyles: Record<StudentAttendanceStatus, string> = {
  HADIR: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  IZIN: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  SAKIT: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  ALPHA: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
}

function countFor(course: StudentAttendanceCourse, status: StudentAttendanceStatus) {
  const key = status === "HADIR" ? "present" : status === "IZIN" ? "permission" : status === "SAKIT" ? "sick" : "absent"
  return course.attendance[key]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(value))
}

function AttendanceProgress({ course }: { course: StudentAttendanceCourse }) {
  const percentage = course.attendance.percentage
  return <div><div className="mb-2 flex items-center justify-between"><span className="text-xs text-muted-foreground">Kehadiran tercatat</span><strong className="text-lg tabular-nums">{percentage}%</strong></div><div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${percentage}%` }} /></div></div>
}

function LoadingState() {
  return <div className="space-y-4"><Skeleton className="h-36 rounded-2xl" /><div className="grid grid-cols-3 gap-3"><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /><Skeleton className="h-32 rounded-2xl" /></div><Skeleton className="h-64 rounded-2xl" /></div>
}

export default function MahasiswaPresensiPage() {
  const [data, setData] = useState<StudentMyAttendanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<StudentAttendanceCourse | null>(null)

  const loadAttendance = async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getMyAttendance())
    } catch (loadError) {
      setError(studentAttendanceErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getMyAttendance()
      .then((attendance) => { if (active) setData(attendance) })
      .catch((loadError) => { if (active) setError(studentAttendanceErrorMessage(loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filteredCourses = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("id-ID")
    if (!normalized) return data?.courses ?? []
    return (data?.courses ?? []).filter((course) => `${course.course.code} ${course.course.name}`.toLocaleLowerCase("id-ID").includes(normalized))
  }, [data, query])

  if (loading) return <main className="mx-auto w-full max-w-7xl py-5 sm:py-7"><LoadingState /></main>
  if (error || !data) return <main className="mx-auto w-full max-w-7xl py-5 sm:py-7"><Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><UsersRound className="size-10 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">Presensi tidak dapat dimuat</h1><p className="mt-1 max-w-md text-sm text-muted-foreground">{error ?? "Data presensi tidak tersedia."}</p><Button className="mt-5" onClick={() => void loadAttendance()}><RefreshCw />Coba Lagi</Button></CardContent></Card></main>

  const summaries = [
    { label: "Kehadiran Keseluruhan", value: `${data.summary.attendancePercentage}%`, note: `${data.summary.present} dari ${data.summary.totalRecords} catatan`, icon: UsersRound },
    { label: "Total Hadir", value: data.summary.present, note: "Catatan semester ini", icon: CheckCircle2 },
    { label: "Total Alpa", value: data.summary.absent, note: "Catatan semester ini", icon: CircleAlert },
  ]

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 md:pb-7">
      <header className="overflow-hidden rounded-2xl border bg-card">
        <div className="px-5 py-6 sm:px-7"><p className="text-sm font-medium text-primary">Rekap kehadiranmu</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Presensi</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Pantau catatan kehadiran dari mata kuliah KRS yang telah disetujui.</p></div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <span className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" />Tahun Akademik <strong>{data.academicYear.year}</strong></span>
          <span className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" />Semester <strong>{data.academicYear.semester === "GANJIL" ? "Ganjil" : "Genap"}</strong></span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {summaries.map(({ label, value, note, icon: Icon }, index) => <Card key={label} className={cn(index === 0 && "col-span-2 sm:col-span-1")}><CardContent className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><p className="mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span></CardContent></Card>)}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Presensi per Mata Kuliah</h2><p className="text-sm text-muted-foreground">Data presensi hanya dapat dilihat.</p></div><label className="relative block w-full sm:max-w-xs"><span className="sr-only">Cari mata kuliah</span><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode atau mata kuliah…" className="pl-9" /></label></div>

        {!data.courses.length ? (
          <Card><CardContent className="flex min-h-56 flex-col items-center justify-center text-center"><Clock3 className="size-10 text-muted-foreground" /><h3 className="mt-4 font-semibold">Belum ada data presensi</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">Catatan akan tampil setelah presensi perkuliahan direkam.</p></CardContent></Card>
        ) : !filteredCourses.length ? (
          <Card><CardContent className="flex min-h-48 flex-col items-center justify-center text-center"><Search className="size-9 text-muted-foreground" /><h3 className="mt-4 font-semibold">Mata kuliah tidak ditemukan</h3><Button variant="outline" className="mt-4" onClick={() => setQuery("")}>Hapus Pencarian</Button></CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCourses.map((course) => <Card key={course.kelasMataKuliahId}><CardContent><div><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{course.course.code}</Badge><span className="text-xs text-muted-foreground">{course.course.credits} SKS · Kelas {course.class.name}</span></div><h3 className="mt-2 font-semibold">{course.course.name}</h3></div><div className="mt-5"><AttendanceProgress course={course} /></div><dl className="mt-5 grid grid-cols-4 gap-2">{statuses.map((status) => <div key={status} className="rounded-xl bg-muted/45 px-2 py-3 text-center"><dt className="text-xs text-muted-foreground">{statusLabels[status]}</dt><dd className="mt-1 text-lg font-semibold tabular-nums">{countFor(course, status)}</dd></div>)}</dl><Button variant="outline" className="mt-5 w-full" onClick={() => setSelectedCourse(course)}><Eye />Lihat Detail</Button></CardContent></Card>)}
          </div>
        )}
      </section>

      <Dialog open={Boolean(selectedCourse)} onOpenChange={(open) => { if (!open) setSelectedCourse(null) }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          {selectedCourse && <><DialogHeader><div className="flex gap-2"><Badge variant="secondary">{selectedCourse.course.code}</Badge><Badge variant="outline">{selectedCourse.course.credits} SKS</Badge></div><DialogTitle>{selectedCourse.course.name}</DialogTitle><DialogDescription>Riwayat presensi semester {data.academicYear.semester === "GANJIL" ? "Ganjil" : "Genap"} {data.academicYear.year}</DialogDescription></DialogHeader><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl border p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="size-3.5" />Dosen</p><p className="mt-2 text-sm font-medium">{selectedCourse.lecturer.name}</p></div><div className="rounded-xl border p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><GraduationCap className="size-3.5" />Kelas</p><p className="mt-2 text-sm font-medium">{selectedCourse.class.name}</p></div></div><div className="rounded-xl border p-4"><AttendanceProgress course={selectedCourse} /><dl className="mt-4 grid grid-cols-4 gap-2">{statuses.map((status) => <div key={status} className="rounded-lg bg-muted/45 p-2 text-center"><dt className="text-xs text-muted-foreground">{statusLabels[status]}</dt><dd className="mt-1 font-semibold">{countFor(selectedCourse, status)}</dd></div>)}</dl></div>{selectedCourse.attendance.absent > 0 && <Alert><CircleAlert /><AlertTitle>Ada catatan alpa</AlertTitle><AlertDescription>Hubungi dosen atau program studi jika catatan tersebut tidak sesuai.</AlertDescription></Alert>}<div><h3 className="text-sm font-semibold">Riwayat Pertemuan</h3>{selectedCourse.records.length ? <ol className="mt-3 divide-y rounded-xl border px-4">{selectedCourse.records.map((record) => <li key={record.id} className="flex items-start gap-3 py-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted"><CalendarDays className="size-4" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium">{record.topic || `Pertemuan ke-${record.meetingNumber}`}</p><time className="text-xs text-muted-foreground">{formatDate(record.date)}</time>{record.note && <p className="mt-1 text-xs text-muted-foreground">Catatan: {record.note}</p>}</div><Badge variant="outline" className={cn("shrink-0", statusStyles[record.status])}>{statusLabels[record.status]}</Badge></li>)}</ol> : <p className="mt-3 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">Belum ada catatan pertemuan.</p>}</div></>}
        </DialogContent>
      </Dialog>
    </main>
  )
}
