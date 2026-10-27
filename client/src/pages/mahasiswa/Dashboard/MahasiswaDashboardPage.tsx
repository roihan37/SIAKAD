import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  GraduationCap,
  MapPin,
  Sparkles,
  UserCheck,
  WalletCards,
} from "lucide-react"
import { Link } from "react-router"
import { getStudentDashboard, studentDashboardErrorMessage } from "@/api/student-dashboard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { StudentDashboard } from "@/types/student-dashboard"

type ScheduleStatus = "Selesai" | "Berlangsung" | "Berikutnya"

const quickActions: Array<{ label: string; description: string; path: string; icon: LucideIcon }> = [
  { label: "KRS", description: "Rencana studi", path: "/mahasiswa/krs", icon: ClipboardList },
  { label: "Jadwal", description: "Kuliah semester", path: "/mahasiswa/jadwal-kuliah", icon: CalendarDays },
  { label: "Nilai", description: "Nilai & KHS", path: "/mahasiswa/nilai-khs", icon: GraduationCap },
  { label: "Presensi", description: "Riwayat hadir", path: "/mahasiswa/presensi", icon: UserCheck },
]

const scheduleStatusStyles: Record<ScheduleStatus, string> = {
  Selesai: "border-border bg-muted text-muted-foreground",
  Berlangsung: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300",
  Berikutnya: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300",
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 11) return "Selamat pagi"
  if (hour < 15) return "Selamat siang"
  if (hour < 18) return "Selamat sore"
  return "Selamat malam"
}

const dayNames = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"] as const

function scheduleStatus(startTime: string, endTime: string): ScheduleStatus {
  const current = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" })
  if (current > endTime) return "Selesai"
  if (current >= startTime) return "Berlangsung"
  return "Berikutnya"
}

function krsStatusLabel(status: StudentDashboard["krs"]["status"]) {
  return status ? { DRAFT: "Draf", DIAJUKAN: "Diajukan", DISETUJUI: "Disetujui", DITOLAK: "Ditolak" }[status] : "Belum ada"
}

function tuitionStatusLabel(status: StudentDashboard["tuition"] extends infer T ? T : never) {
  if (!status) return "Belum ada tagihan"
  return { BELUM_DIBAYAR: "Belum dibayar", SEBAGIAN: "Dibayar sebagian", LUNAS: "Lunas", JATUH_TEMPO: "Jatuh tempo" }[status.status]
}

function SectionHeading({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <CardHeader className="gap-1.5 border-b border-border/70 pb-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription className="mt-0.5 text-xs sm:text-sm">{description}</CardDescription>}
        </div>
      </div>
      {action && <CardAction>{action}</CardAction>}
    </CardHeader>
  )
}

export default function MahasiswaDashboardPage() {
  const [data, setData] = useState<StudentDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    void getStudentDashboard(controller.signal)
      .then(setData)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(studentDashboardErrorMessage(requestError, "Dashboard gagal dimuat."))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [retryKey])

  const retry = () => {
    setLoading(true)
    setError(null)
    setRetryKey((key) => key + 1)
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-7xl space-y-5 py-5"><Skeleton className="h-48 w-full" /><div className="grid grid-cols-3 gap-4"><Skeleton className="h-28" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div><Skeleton className="h-80 w-full" /></main>
  }

  if (error || !data) {
    return <main className="mx-auto w-full max-w-7xl py-7"><Alert variant="destructive"><AlertTitle>Dashboard tidak dapat dimuat</AlertTitle><AlertDescription className="space-y-3"><p>{error ?? "Data dashboard tidak tersedia."}</p><Button variant="outline" size="sm" onClick={retry}>Coba Lagi</Button></AlertDescription></Alert></main>
  }

  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())
  const firstName = data.student.name.split(" ")[0]
  const currentDay = dayNames[new Date().getDay()]
  const todaySchedule = data.schedules.filter((item) => item.day === currentDay).map((item) => ({
    id: item.id,
    time: `${item.startTime}–${item.endTime}`,
    course: item.course.name,
    code: item.course.code,
    lecturer: item.lecturer.name,
    room: item.room.name || item.room.code,
    status: scheduleStatus(item.startTime, item.endTime),
  }))
  const attendanceByCourse = data.attendanceCourses.map((item) => ({
    id: item.kelasMataKuliahId,
    course: item.course.name,
    attended: item.attendance.present,
    meetings: item.attendance.totalRecords,
  }))
  const summaries = [
    { label: "IPK", value: data.summary.cumulativeGpa.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), note: "Skala 4,00", icon: GraduationCap, tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { label: "SKS ditempuh", value: data.summary.completedCredits, note: "Kumulatif", icon: BookOpenCheck, tone: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
    { label: "Kehadiran", value: `${data.summary.attendancePercentage}%`, note: "Semester ini", icon: UserCheck, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  ]

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground">{greeting()},</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{firstName} <span aria-hidden="true">👋</span></h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Semoga harimu menyenangkan. Berikut agenda akademikmu hari ini.</p>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm">
              <span className="font-medium">{data.student.studyProgram.name}</span>
              <span className="text-muted-foreground">Semester {data.student.semester}</span>
              <span className="text-muted-foreground">{data.academicYear.year} {data.academicYear.semester === "GANJIL" ? "Ganjil" : "Genap"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t bg-muted/30 px-5 py-3 text-xs text-muted-foreground sm:px-7">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <time>{today}</time>
        </div>
      </header>

      <section aria-labelledby="summary-title">
        <h2 id="summary-title" className="sr-only">Ringkasan akademik</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {summaries.map(({ label, value, note, icon: Icon, tone }, index) => (
            <Card key={label} className={cn("gap-3", index === 2 && "col-span-2 sm:col-span-1")}>
              <CardContent className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{note}</p>
                </div>
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10", tone)}>
                  <Icon className="size-[18px] sm:size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.9fr)] lg:gap-6">
        <div className="space-y-5 sm:space-y-6">
          <Card>
            <SectionHeading
              icon={CalendarDays}
              title="Jadwal Hari Ini"
              description={`${todaySchedule.length} kelas terjadwal`}
              action={<Button nativeButton={false} variant="ghost" size="sm" render={<Link to="/mahasiswa/jadwal-kuliah" />}>Semua <ArrowRight /></Button>}
            />
            <CardContent>
              <ol className="divide-y divide-border/70">
                {todaySchedule.map((item) => (
                  <li key={item.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                    <div className="flex items-center justify-between gap-3 sm:block">
                      <p className="flex items-center gap-1.5 text-xs font-medium tabular-nums sm:text-sm">
                        <Clock3 className="size-3.5 text-muted-foreground" aria-hidden="true" />{item.time}
                      </p>
                      <Badge variant="outline" className={cn("sm:mt-2", scheduleStatusStyles[item.status])}>{item.status}</Badge>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium leading-5">{item.course}</p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.code} · {item.lecturer}</p>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:max-w-32 sm:justify-end sm:text-right">
                      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />{item.room}
                    </p>
                  </li>
                ))}
                {todaySchedule.length === 0 && <li className="py-8 text-center text-sm text-muted-foreground">Tidak ada jadwal kuliah hari ini.</li>}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <SectionHeading icon={UserCheck} title="Ringkasan Presensi" description="Kehadiran per mata kuliah semester ini" />
            <CardContent className="space-y-5">
              {attendanceByCourse.map((item) => {
                const percentage = item.meetings ? Math.round((item.attended / item.meetings) * 100) : 0
                return (
                  <div key={item.id}>
                    <div className="mb-2 flex items-end justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{item.course}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{item.attended} dari {item.meetings} pertemuan</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums">{percentage}%</p>
                    </div>
                    <div role="progressbar" aria-label={`Kehadiran ${item.course}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage} className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-600 transition-[width] motion-reduce:transition-none" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })}
              {attendanceByCourse.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Belum ada data presensi semester ini.</p>}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5 sm:space-y-6" aria-label="Informasi pendukung">
          <section aria-labelledby="quick-action-title">
            <h2 id="quick-action-title" className="mb-3 text-sm font-semibold">Akses cepat</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, description, path, icon: Icon }) => (
                <Link key={path} to={path} className="group rounded-xl border border-border/70 bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{label}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground sm:text-xs">{description}</p>
                </Link>
              ))}
            </div>
          </section>

          <Card>
            <SectionHeading icon={BookOpenCheck} title="Status Akademik" />
            <CardContent className="space-y-3">
              <Link to="/mahasiswa/krs" className="flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><ClipboardList className="size-[18px]" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">Kartu Rencana Studi</span><span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold"><CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />{krsStatusLabel(data.krs.status)} · {data.krs.selectedCredits} SKS</span></span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
              <Link to="/mahasiswa/tagihan-ukt" className="flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><WalletCards className="size-[18px]" aria-hidden="true" /></span>
                <span className="min-w-0 flex-1"><span className="block text-xs text-muted-foreground">Status UKT</span><span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold"><CheckCircle2 className="size-3.5 text-emerald-600" aria-hidden="true" />{tuitionStatusLabel(data.tuition)}{data.tuition ? ` · ${data.tuition.academicYear.year}` : ""}</span></span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-0 bg-primary text-primary-foreground ring-0">
            <CardContent className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10"><Bot className="size-5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5"><p className="font-semibold">AI Assistant</p><Sparkles className="size-3.5" aria-hidden="true" /></div>
                <p className="mt-1 text-xs leading-5 text-primary-foreground/75">Tanyakan jadwal, nilai, atau informasi akademikmu.</p>
                <Button nativeButton={false} variant="secondary" size="sm" className="mt-3" render={<Link to="/mahasiswa/ai-assistant" />}>Mulai bertanya <ArrowRight /></Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
