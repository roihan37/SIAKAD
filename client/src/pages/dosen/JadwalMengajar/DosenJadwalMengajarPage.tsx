import { useMemo, useState } from "react"
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  List,
  MapPin,
  RotateCcw,
  UsersRound,
} from "lucide-react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type DayKey = "SENIN" | "SELASA" | "RABU" | "KAMIS" | "JUMAT" | "SABTU"
type ScheduleStatus = "Akan Datang" | "Sedang Berlangsung" | "Selesai"
type ScheduleView = "weekly" | "list"

type TeachingSchedule = {
  id: number
  day: DayKey
  startTime: string
  endTime: string
  courseCode: string
  courseName: string
  credits: number
  className: string
  room: string
  students: number
  status: ScheduleStatus
}

const academicYear = "2026/2027 Ganjil"

const days: Array<{ key: DayKey; label: string; shortLabel: string }> = [
  { key: "SENIN", label: "Senin", shortLabel: "Sen" },
  { key: "SELASA", label: "Selasa", shortLabel: "Sel" },
  { key: "RABU", label: "Rabu", shortLabel: "Rab" },
  { key: "KAMIS", label: "Kamis", shortLabel: "Kam" },
  { key: "JUMAT", label: "Jumat", shortLabel: "Jum" },
  { key: "SABTU", label: "Sabtu", shortLabel: "Sab" },
]

const schedules: TeachingSchedule[] = [
  { id: 1, day: "SENIN", startTime: "08.00", endTime: "09.40", courseCode: "IF201", courseName: "Algoritma dan Pemrograman", credits: 3, className: "TI-2A", room: "Lab Komputer 2", students: 32, status: "Selesai" },
  { id: 2, day: "SENIN", startTime: "10.00", endTime: "11.40", courseCode: "IF203", courseName: "Struktur Data", credits: 3, className: "TI-2B", room: "Ruang B-204", students: 30, status: "Selesai" },
  { id: 3, day: "SELASA", startTime: "09.50", endTime: "11.30", courseCode: "IF402", courseName: "Manajemen Proyek TI", credits: 3, className: "TI-4A", room: "Ruang C-301", students: 26, status: "Selesai" },
  { id: 4, day: "RABU", startTime: "13.00", endTime: "14.40", courseCode: "IF305", courseName: "Rekayasa Perangkat Lunak", credits: 3, className: "TI-3A", room: "Ruang C-204", students: 28, status: "Selesai" },
  { id: 5, day: "KAMIS", startTime: "08.00", endTime: "09.40", courseCode: "IF207", courseName: "Basis Data", credits: 3, className: "TI-2C", room: "Lab Komputer 1", students: 31, status: "Selesai" },
  { id: 6, day: "KAMIS", startTime: "10.00", endTime: "11.40", courseCode: "IF309", courseName: "Interaksi Manusia dan Komputer", credits: 2, className: "TI-3B", room: "Ruang B-202", students: 29, status: "Sedang Berlangsung" },
  { id: 7, day: "KAMIS", startTime: "13.00", endTime: "15.30", courseCode: "IF311", courseName: "Pemrograman Web", credits: 3, className: "TI-3A", room: "Lab Komputer 3", students: 28, status: "Akan Datang" },
  { id: 8, day: "JUMAT", startTime: "09.00", endTime: "10.40", courseCode: "IF405", courseName: "Kecerdasan Buatan", credits: 3, className: "TI-4B", room: "Ruang C-305", students: 25, status: "Akan Datang" },
]

const statusStyles: Record<ScheduleStatus, string> = {
  "Akan Datang": "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  "Sedang Berlangsung": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Selesai: "border-border bg-muted/60 text-muted-foreground",
}

const dayFromDate: Record<number, DayKey | undefined> = {
  1: "SENIN",
  2: "SELASA",
  3: "RABU",
  4: "KAMIS",
  5: "JUMAT",
  6: "SABTU",
}

function canRecordAttendance(status: ScheduleStatus) {
  return status === "Sedang Berlangsung" || status === "Selesai"
}

function ScheduleCard({ item, onOpen }: { item: TeachingSchedule; onOpen: (item: TeachingSchedule) => void }) {
  const ongoing = item.status === "Sedang Berlangsung"

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border bg-background transition-colors",
        ongoing
          ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/20 dark:ring-emerald-900"
          : "border-border/80 hover:border-primary/30",
      )}
    >
      <button type="button" className="w-full p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset" onClick={() => onOpen(item)}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
            <Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
            {item.startTime}–{item.endTime}
          </p>
          <Badge variant="outline" className={statusStyles[item.status]}>{item.status}</Badge>
        </div>
        <p className="mt-3 font-semibold leading-5">{item.courseName}</p>
        <p className="mt-1 text-xs text-muted-foreground">{item.courseCode} · {item.credits} SKS · Kelas {item.className}</p>
        <div className="mt-3 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
          <span className="flex items-center gap-1.5"><MapPin className="size-3.5" aria-hidden="true" />{item.room}</span>
          <span className="flex items-center gap-1.5"><UsersRound className="size-3.5" aria-hidden="true" />{item.students} mahasiswa</span>
        </div>
      </button>
      <div className="flex flex-col gap-2 border-t border-border/70 bg-card/70 p-3 sm:flex-row">
        <Button nativeButton={false} variant="outline" size="sm" className="w-full sm:flex-1" render={<Link to="/dosen/kelas-mata-kuliah" />}>
          <BookOpen aria-hidden="true" /> Lihat Kelas
        </Button>
        {canRecordAttendance(item.status) && (
          <Button nativeButton={false} size="sm" className="w-full sm:flex-1" render={<Link to="/dosen/presensi" />}>
            <ClipboardCheck aria-hidden="true" /> Catat Presensi
          </Button>
        )}
      </div>
    </article>
  )
}

export default function DosenJadwalMengajarPage() {
  const todayKey = dayFromDate[new Date().getDay()]
  const [view, setView] = useState<ScheduleView>(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) return "list"
    return "weekly"
  })
  const [dayFilter, setDayFilter] = useState<DayKey | "ALL">("ALL")
  const [courseFilter, setCourseFilter] = useState<string>("ALL")
  const [selectedSchedule, setSelectedSchedule] = useState<TeachingSchedule | null>(null)

  const courses = useMemo(() => {
    const uniqueCourses = new Map(schedules.map((item) => [item.courseCode, item.courseName]))
    return Array.from(uniqueCourses, ([code, name]) => ({ code, name }))
  }, [])

  const filteredSchedules = useMemo(
    () => schedules.filter((item) => (dayFilter === "ALL" || item.day === dayFilter) && (courseFilter === "ALL" || item.courseCode === courseFilter)),
    [courseFilter, dayFilter],
  )

  const displayedDays = useMemo(() => {
    const availableDays = days.filter((day) => dayFilter === "ALL" ? filteredSchedules.some((item) => item.day === day.key) : day.key === dayFilter)
    if (view === "list" && dayFilter === "ALL" && todayKey) {
      return [...availableDays].sort((a, b) => (a.key === todayKey ? -1 : b.key === todayKey ? 1 : 0))
    }
    return availableDays
  }, [dayFilter, filteredSchedules, todayKey, view])

  const resetFilters = () => {
    setDayFilter("ALL")
    setCourseFilter("ALL")
  }

  const showToday = () => {
    if (!todayKey) return
    setDayFilter(todayKey)
    setView("list")
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Perkuliahan</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Jadwal Mengajar</h1>
              <p className="mt-2 text-sm text-muted-foreground">Tahun Akademik {academicYear}</p>
            </div>
            <Badge variant="outline" className="w-fit border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Database aria-hidden="true" /> Data Dummy
            </Badge>
          </div>
        </div>
        <div className="flex items-start gap-2 border-t border-amber-200 bg-amber-50/80 px-5 py-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 sm:px-7">
          <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>Jadwal pada halaman ini merupakan data dummy untuk pratinjau tampilan dan belum terhubung ke API.</p>
        </div>
      </header>

      <section className="rounded-xl border border-border/70 bg-card p-4" aria-label="Kontrol jadwal">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Hari
              <Select value={dayFilter} onValueChange={(value) => setDayFilter(value as DayKey | "ALL")}>
                <SelectTrigger className="w-full min-w-44 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Hari</SelectItem>
                  {days.map((day) => <SelectItem key={day.key} value={day.key}>{day.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Mata Kuliah
              <Select value={courseFilter} onValueChange={(value) => setCourseFilter(value ?? "ALL")}>
                <SelectTrigger className="w-full min-w-56 bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Mata Kuliah</SelectItem>
                  {courses.map((course) => <SelectItem key={course.code} value={course.code}>{course.code} · {course.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" onClick={showToday} disabled={!todayKey} className="w-full sm:w-auto">
              <CalendarDays aria-hidden="true" /> Hari Ini
            </Button>
            <div className="grid grid-cols-2 rounded-lg border border-border bg-background p-1" aria-label="Pilih tampilan jadwal">
              <Button size="sm" variant={view === "weekly" ? "secondary" : "ghost"} aria-pressed={view === "weekly"} onClick={() => setView("weekly")}>
                <CalendarRange aria-hidden="true" /> Mingguan
              </Button>
              <Button size="sm" variant={view === "list" ? "secondary" : "ghost"} aria-pressed={view === "list"} onClick={() => setView("list")}>
                <List aria-hidden="true" /> Daftar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {filteredSchedules.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><CalendarDays aria-hidden="true" /></span>
            <h2 className="mt-4 text-base font-semibold">Tidak ada jadwal ditemukan</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Belum ada jadwal mengajar yang sesuai dengan filter hari dan mata kuliah.</p>
            <Button variant="outline" className="mt-4" onClick={resetFilters}><RotateCcw aria-hidden="true" /> Reset Filter</Button>
          </CardContent>
        </Card>
      ) : view === "weekly" ? (
        <section aria-labelledby="weekly-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="weekly-title" className="text-base font-semibold">Jadwal Mingguan</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Pilih jadwal untuk melihat detail lengkap.</p>
            </div>
          </div>
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {displayedDays.map((day) => {
              const daySchedules = filteredSchedules.filter((item) => item.day === day.key)
              return (
                <Card key={day.key} className={cn(day.key === todayKey && "ring-primary/30")}>
                  <CardHeader className="border-b border-border/70 pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle>{day.label}</CardTitle>
                      {day.key === todayKey && <Badge variant="secondary">Hari ini</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{daySchedules.length} jadwal</p>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {daySchedules.map((item) => <ScheduleCard key={item.id} item={item} onOpen={setSelectedSchedule} />)}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ) : (
        <section className="space-y-5" aria-labelledby="list-title">
          <div>
            <h2 id="list-title" className="text-base font-semibold">Daftar Jadwal</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Jadwal hari ini ditampilkan lebih dahulu.</p>
          </div>
          {displayedDays.map((day) => {
            const daySchedules = filteredSchedules.filter((item) => item.day === day.key)
            return (
              <div key={day.key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{day.label}</h3>
                  {day.key === todayKey && <Badge variant="secondary">Hari ini</Badge>}
                  <span className="text-xs text-muted-foreground">{daySchedules.length} jadwal</span>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {daySchedules.map((item) => <ScheduleCard key={item.id} item={item} onOpen={setSelectedSchedule} />)}
                </div>
              </div>
            )
          })}
        </section>
      )}

      <Dialog open={selectedSchedule !== null} onOpenChange={(open) => !open && setSelectedSchedule(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedSchedule && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <Badge variant="outline" className={statusStyles[selectedSchedule.status]}>{selectedSchedule.status}</Badge>
                  <span className="text-xs text-muted-foreground">{selectedSchedule.courseCode} · {selectedSchedule.credits} SKS</span>
                </div>
                <DialogTitle className="text-lg">{selectedSchedule.courseName}</DialogTitle>
                <DialogDescription>Detail jadwal mengajar dan kelas.</DialogDescription>
              </DialogHeader>
              <dl className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs text-muted-foreground">Kelas</dt><dd className="mt-1 font-medium">{selectedSchedule.className}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Hari & Waktu</dt><dd className="mt-1 font-medium">{days.find((day) => day.key === selectedSchedule.day)?.label}, {selectedSchedule.startTime}–{selectedSchedule.endTime}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Ruangan</dt><dd className="mt-1 font-medium">{selectedSchedule.room}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Jumlah Mahasiswa</dt><dd className="mt-1 font-medium">{selectedSchedule.students} mahasiswa</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-muted-foreground">Tahun Akademik</dt><dd className="mt-1 font-medium">{academicYear}</dd></div>
              </dl>
              <DialogFooter>
                <Button nativeButton={false} variant="outline" render={<Link to="/dosen/kelas-mata-kuliah" />}><BookOpen aria-hidden="true" /> Lihat Kelas</Button>
                {canRecordAttendance(selectedSchedule.status) && (
                  <Button nativeButton={false} render={<Link to="/dosen/presensi" />}><CheckCircle2 aria-hidden="true" /> Catat Presensi</Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
