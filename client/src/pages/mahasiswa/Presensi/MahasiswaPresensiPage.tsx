import { useState } from "react"
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  GraduationCap,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
} from "lucide-react"
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
import { cn } from "@/lib/utils"
import {
  attendanceCourses,
  attendanceProfile,
  type AttendanceCourse,
  type AttendanceStatus,
} from "./presensi-data"

const statuses: AttendanceStatus[] = ["Hadir", "Izin", "Sakit", "Alpa"]

const statusStyles: Record<AttendanceStatus, string> = {
  Hadir: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Izin: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  Sakit: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Alpa: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
}

function attendanceCounts(course: AttendanceCourse) {
  return statuses.reduce<Record<AttendanceStatus, number>>(
    (counts, status) => ({ ...counts, [status]: course.meetings.filter((meeting) => meeting.status === status).length }),
    { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 },
  )
}

function attendancePercentage(course: AttendanceCourse) {
  if (!course.meetings.length) return 0
  return Math.round((attendanceCounts(course).Hadir / course.meetings.length) * 100)
}

function progressTone(percentage: number) {
  if (percentage < attendanceProfile.minimumAttendance) return "bg-red-500"
  if (percentage < 85) return "bg-amber-500"
  return "bg-emerald-600"
}

function AttendanceProgress({ course }: { course: AttendanceCourse }) {
  const percentage = attendancePercentage(course)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs text-muted-foreground">Kehadiran</span>
        <strong className={cn("text-lg tabular-nums", percentage < attendanceProfile.minimumAttendance && "text-red-600 dark:text-red-400")}>{percentage}%</strong>
      </div>
      <div role="progressbar" aria-label={`Kehadiran ${course.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className="h-2.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-[width] motion-reduce:transition-none", progressTone(percentage))} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

export default function MahasiswaPresensiPage() {
  const [query, setQuery] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<AttendanceCourse | null>(null)
  const [correctionRequested, setCorrectionRequested] = useState(false)

  const allMeetings = attendanceCourses.flatMap((course) => course.meetings)
  const totalPresent = allMeetings.filter((meeting) => meeting.status === "Hadir").length
  const totalAbsent = allMeetings.filter((meeting) => meeting.status === "Alpa").length
  const overallPercentage = allMeetings.length ? Math.round((totalPresent / allMeetings.length) * 100) : 0
  const lowAttendanceCourses = attendanceCourses.filter((course) => attendancePercentage(course) < attendanceProfile.minimumAttendance)
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")
  const filteredCourses = normalizedQuery
    ? attendanceCourses.filter((course) =>
        `${course.code} ${course.name}`.toLocaleLowerCase("id-ID").includes(normalizedQuery),
      )
    : attendanceCourses

  const openDetail = (course: AttendanceCourse) => {
    setCorrectionRequested(false)
    setSelectedCourse(course)
  }

  const summaries = [
    { label: "Kehadiran Keseluruhan", value: `${overallPercentage}%`, note: `${totalPresent} dari ${allMeetings.length} pertemuan`, icon: UsersRound, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    { label: "Total Hadir", value: totalPresent, note: "Pertemuan semester ini", icon: CheckCircle2, tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { label: "Total Alpa", value: totalAbsent, note: "Perlu diperhatikan", icon: CircleAlert, tone: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300" },
  ]

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-medium text-primary">Rekap kehadiranmu</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Presensi</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pantau kehadiran setiap mata kuliah dan segera periksa catatan yang perlu dikoreksi.</p>
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <div className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Tahun Akademik</span><strong className="ml-2 font-medium">{attendanceProfile.academicYear}</strong></span></div>
          <div className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Semester</span><strong className="ml-2 font-medium">{attendanceProfile.semester}</strong></span></div>
        </div>
      </header>

      <section aria-labelledby="attendance-summary-title">
        <h2 id="attendance-summary-title" className="sr-only">Ringkasan presensi</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {summaries.map(({ label, value, note, icon: Icon, tone }, index) => (
            <Card key={label} className={cn("gap-3", index === 0 && "col-span-2 sm:col-span-1")}>
              <CardContent className="flex items-start justify-between gap-3">
                <div><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p><p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{note}</p></div>
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10", tone)}><Icon className="size-[18px] sm:size-5" aria-hidden="true" /></span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {lowAttendanceCourses.length > 0 && (
        <Alert className="border-amber-300 bg-amber-50/70 px-4 py-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <AlertTriangle className="size-5" aria-hidden="true" />
          <AlertTitle>Kehadiran di bawah batas minimum</AlertTitle>
          <AlertDescription className="text-amber-800 dark:text-amber-300">{lowAttendanceCourses.map((course) => course.name).join(", ")} berada di bawah batas {attendanceProfile.minimumAttendance}%. Periksa riwayat dan hubungi dosen jika ada catatan yang tidak sesuai.</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="course-attendance-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><h2 id="course-attendance-title" className="text-lg font-semibold">Presensi per Mata Kuliah</h2><p className="mt-1 text-sm text-muted-foreground">Data hanya dapat dilihat dan tidak dapat diubah langsung.</p></div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">Cari mata kuliah</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kode atau mata kuliah…" className="h-10 pl-9" />
          </label>
        </div>

        {!attendanceCourses.length ? (
          <Card><CardContent className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><Clock3 className="size-10 text-muted-foreground" aria-hidden="true" /><h3 className="mt-4 font-semibold">Belum ada data presensi</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">Catatan presensi akan tampil setelah perkuliahan dimulai.</p></CardContent></Card>
        ) : filteredCourses.length === 0 ? (
          <Card><CardContent className="flex min-h-48 flex-col items-center justify-center px-6 text-center"><Search className="size-9 text-muted-foreground" aria-hidden="true" /><h3 className="mt-4 font-semibold">Mata kuliah tidak ditemukan</h3><p className="mt-1 text-sm text-muted-foreground">Coba gunakan kode atau nama mata kuliah lain.</p><Button type="button" variant="outline" className="mt-4" onClick={() => setQuery("")}>Hapus Pencarian</Button></CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCourses.map((course) => {
              const counts = attendanceCounts(course)
              const percentage = attendancePercentage(course)
              return (
                <Card key={course.id} className={cn("gap-4", percentage < attendanceProfile.minimumAttendance && "ring-amber-300 dark:ring-amber-900")}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{course.code}</Badge><span className="text-xs text-muted-foreground">{course.credits} SKS · Kelas {course.className}</span></div><h3 className="mt-2 font-semibold leading-5">{course.name}</h3></div>
                      {percentage < attendanceProfile.minimumAttendance && <Badge variant="outline" className="shrink-0 border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"><AlertTriangle />Rendah</Badge>}
                    </div>
                    <div className="mt-5"><AttendanceProgress course={course} /></div>
                    <dl className="mt-5 grid grid-cols-4 gap-2">
                      {statuses.map((status) => <div key={status} className="rounded-xl bg-muted/45 px-2 py-3 text-center"><dt className="text-[10px] text-muted-foreground sm:text-xs">{status}</dt><dd className="mt-1 text-base font-semibold tabular-nums sm:text-lg">{counts[status]}</dd></div>)}
                    </dl>
                    <Button type="button" variant="outline" className="mt-5 w-full" onClick={() => openDetail(course)}><Eye />Lihat Detail</Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <Dialog open={Boolean(selectedCourse)} onOpenChange={(open) => { if (!open) { setSelectedCourse(null); setCorrectionRequested(false) } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          {selectedCourse && (() => {
            const counts = attendanceCounts(selectedCourse)
            const hasProblematicRecord = counts.Alpa > 0
            return (
              <>
                <DialogHeader>
                  <div className="mb-1 flex flex-wrap items-center gap-2"><Badge variant="secondary">{selectedCourse.code}</Badge><Badge variant="outline">{selectedCourse.credits} SKS</Badge></div>
                  <DialogTitle className="text-lg leading-6">{selectedCourse.name}</DialogTitle>
                  <DialogDescription>Riwayat presensi semester {attendanceProfile.semester} {attendanceProfile.academicYear}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border bg-muted/20 p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="size-3.5" aria-hidden="true" />Dosen</p><p className="mt-2 text-sm font-medium leading-5">{selectedCourse.lecturer}</p></div>
                  <div className="rounded-xl border bg-muted/20 p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><GraduationCap className="size-3.5" aria-hidden="true" />Kelas</p><p className="mt-2 text-sm font-medium">{selectedCourse.className}</p></div>
                </div>

                <div className="rounded-xl border p-4">
                  <AttendanceProgress course={selectedCourse} />
                  <dl className="mt-4 grid grid-cols-4 gap-2">
                    {statuses.map((status) => <div key={status} className="rounded-lg bg-muted/45 p-2 text-center"><dt className="text-[10px] text-muted-foreground sm:text-xs">{status}</dt><dd className="mt-1 font-semibold tabular-nums">{counts[status]}</dd></div>)}
                  </dl>
                </div>

                {hasProblematicRecord && (
                  <Alert className="border-amber-300 bg-amber-50/70 px-4 py-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    <ShieldAlert className="size-5" aria-hidden="true" />
                    <AlertTitle>Ada catatan yang perlu diperiksa</AlertTitle>
                    <AlertDescription className="space-y-3 text-amber-800 dark:text-amber-300">
                      <p>Terdapat {counts.Alpa} status alpa. Kamu tidak dapat mengedit presensi; ajukan koreksi jika catatan tidak sesuai.</p>
                      {correctionRequested ? <p className="font-medium">Pengajuan koreksi dummy sudah dicatat untuk ditinjau.</p> : <Button type="button" variant="outline" size="sm" className="border-amber-400 bg-background text-foreground" onClick={() => setCorrectionRequested(true)}>Ajukan Koreksi</Button>}
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <h3 className="text-sm font-semibold">Riwayat Pertemuan</h3>
                  <ol className="mt-3 divide-y divide-border/70 rounded-xl border px-4">
                    {selectedCourse.meetings.map((meeting) => (
                      <li key={meeting.id} className="flex items-start gap-3 py-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><CalendarDays className="size-4" aria-hidden="true" /></span>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium leading-5">{meeting.topic}</p><time className="mt-0.5 block text-xs text-muted-foreground">{meeting.date}</time></div>
                        <Badge variant="outline" className={cn("shrink-0", statusStyles[meeting.status])}>{meeting.status}</Badge>
                      </li>
                    ))}
                  </ol>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </main>
  )
}
