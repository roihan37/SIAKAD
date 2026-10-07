import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChevronRight,
  CircleAlert,
  Clock3,
  GraduationCap,
  List,
  MapPin,
  MonitorUp,
  UserRound,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  courseSchedules,
  scheduleDays,
  scheduleProfile,
  type CourseSchedule,
  type ScheduleDay,
} from "./jadwal-data"

type ScheduleView = "weekly" | "list"
type ScheduleHighlight = "ongoing" | "next" | null

const dayByJsIndex: ScheduleDay[] = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"]

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(".").map(Number)
  return hours * 60 + minutes
}

function ScheduleBadge({ highlight }: { highlight: ScheduleHighlight }) {
  if (!highlight) return null

  return (
    <Badge
      variant="outline"
      className={cn(
        "w-fit",
        highlight === "ongoing"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
      )}
    >
      {highlight === "ongoing" ? "Sedang Berlangsung" : "Kuliah Berikutnya"}
    </Badge>
  )
}

function EmptySchedule({ dayLabel }: { dayLabel: string }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/15 px-6 py-10 text-center">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <CalendarDays className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-4 font-medium">Tidak ada jadwal pada hari {dayLabel}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Gunakan waktu luang untuk belajar mandiri atau pilih hari lain.</p>
    </div>
  )
}

function ScheduleListCard({
  schedule,
  highlight,
  onSelect,
}: {
  schedule: CourseSchedule
  highlight: ScheduleHighlight
  onSelect: (schedule: CourseSchedule) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(schedule)}
      className={cn(
        "group w-full rounded-2xl border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5",
        highlight === "ongoing" && "border-emerald-300/80 ring-1 ring-emerald-200 dark:border-emerald-800 dark:ring-emerald-900",
        schedule.conflictWith && "border-amber-300/80 dark:border-amber-800",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="w-20 shrink-0 sm:w-24">
          <p className="text-base font-semibold tabular-nums sm:text-lg">{schedule.startTime}</p>
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">s.d. {schedule.endTime}</p>
        </div>
        <div className="min-w-0 flex-1 border-l pl-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold leading-5 sm:text-base">{schedule.courseName}</p>
              <p className="mt-1 text-xs text-muted-foreground">{schedule.courseCode} · {schedule.credits} SKS · Kelas {schedule.className}</p>
            </div>
            <ScheduleBadge highlight={highlight} />
          </div>
          <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-2"><MapPin className="size-3.5 shrink-0" aria-hidden="true" />{schedule.room}</span>
            <span className="flex items-center gap-2"><UserRound className="size-3.5 shrink-0" aria-hidden="true" />{schedule.lecturer}</span>
          </div>
          {schedule.conflictWith && (
            <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />Bentrok dengan {schedule.conflictWith}
            </p>
          )}
        </div>
        <ChevronRight className="mt-1 hidden size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
      </div>
    </button>
  )
}

export default function MahasiswaJadwalPage() {
  const now = useMemo(() => new Date(), [])
  const today = dayByJsIndex[now.getDay()]
  const [selectedDay, setSelectedDay] = useState<ScheduleDay>(today)
  const [view, setView] = useState<ScheduleView>(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches ? "weekly" : "list",
  )
  const [selectedSchedule, setSelectedSchedule] = useState<CourseSchedule | null>(null)

  const schedulesByDay = useMemo(
    () => Object.fromEntries(scheduleDays.map(({ key }) => [key, courseSchedules.filter((schedule) => schedule.day === key)])) as Record<ScheduleDay, CourseSchedule[]>,
    [],
  )
  const selectedDayLabel = scheduleDays.find((day) => day.key === selectedDay)?.label ?? ""
  const selectedSchedules = schedulesByDay[selectedDay]
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const nextScheduleId = schedulesByDay[today]
    .filter((schedule) => minutesFromTime(schedule.startTime) > currentMinutes)
    .sort((first, second) => minutesFromTime(first.startTime) - minutesFromTime(second.startTime))[0]?.id

  const getHighlight = (schedule: CourseSchedule): ScheduleHighlight => {
    if (schedule.day !== today) return null
    const startsAt = minutesFromTime(schedule.startTime)
    const endsAt = minutesFromTime(schedule.endTime)
    if (currentMinutes >= startsAt && currentMinutes < endsAt) return "ongoing"
    if (schedule.id === nextScheduleId) return "next"
    return null
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Agenda perkuliahanmu</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Jadwal Kuliah</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Lihat waktu, kelas, ruangan, dan dosen untuk setiap perkuliahan semester ini.</p>
            </div>
            <div className="inline-flex w-fit rounded-xl bg-muted p-1" aria-label="Pilih tampilan jadwal">
              <Button type="button" size="sm" variant={view === "weekly" ? "default" : "ghost"} onClick={() => setView("weekly")} aria-pressed={view === "weekly"}><CalendarRange />Mingguan</Button>
              <Button type="button" size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")} aria-pressed={view === "list"}><List />Daftar</Button>
            </div>
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <div className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Tahun Akademik</span><strong className="ml-2 font-medium">{scheduleProfile.academicYear}</strong></span></div>
          <div className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Semester</span><strong className="ml-2 font-medium">{scheduleProfile.semester}</strong></span></div>
        </div>
      </header>

      <Alert className="border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>Ada jadwal yang bentrok</AlertTitle>
        <AlertDescription className="text-amber-800/90 dark:text-amber-300">
          IF301 dan IF313 berlangsung pada Senin pukul 08.00. Periksa dan perbaiki pilihan kelas sebelum periode KRS berakhir.
          <Button nativeButton={false} variant="link" className="h-auto w-fit justify-start px-0 text-amber-900 dark:text-amber-200" render={<Link to="/mahasiswa/krs" />}>Buka KRS <ChevronRight /></Button>
        </AlertDescription>
      </Alert>

      <section aria-labelledby="day-selector-title" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="day-selector-title" className="text-lg font-semibold">Jadwal Semester</h2>
            <p className="mt-1 text-sm text-muted-foreground">Waktu ditampilkan dalam WIB</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setSelectedDay(today)}><CalendarDays />Hari Ini</Button>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" role="tablist" aria-label="Pilih hari">
          <div className="flex min-w-max gap-2 sm:grid sm:min-w-0 sm:grid-cols-7">
            {scheduleDays.map((day) => {
              const active = selectedDay === day.key
              const isToday = today === day.key
              return (
                <button
                  key={day.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDay(day.key)}
                  className={cn(
                    "min-w-16 rounded-xl border bg-card px-3 py-2.5 text-center transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-0",
                    active && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  <span className="block text-xs font-semibold sm:hidden">{day.shortLabel}</span>
                  <span className="hidden text-xs font-semibold sm:block">{day.label}</span>
                  <span className={cn("mt-1 block text-[10px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{isToday ? "Hari ini" : `${schedulesByDay[day.key].length} kelas`}</span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {view === "weekly" ? (
        <section aria-label="Jadwal mingguan" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {scheduleDays.map((day) => (
            <div key={day.key} className={cn("min-w-0 rounded-2xl border bg-card", day.key === today && "border-primary/40 ring-1 ring-primary/10")}>
              <div className="flex items-center justify-between border-b px-3 py-3">
                <div><h3 className="text-sm font-semibold">{day.label}</h3>{day.key === today && <p className="mt-0.5 text-[10px] font-medium text-primary">Hari ini</p>}</div>
                <Badge variant="secondary" className="px-1.5 text-[10px]">{schedulesByDay[day.key].length}</Badge>
              </div>
              <div className="space-y-2 p-2.5">
                {schedulesByDay[day.key].map((schedule) => {
                  const highlight = getHighlight(schedule)
                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => setSelectedSchedule(schedule)}
                      className={cn(
                        "w-full rounded-xl border bg-background p-3 text-left transition-colors hover:border-foreground/20 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        highlight === "ongoing" && "border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/30",
                        schedule.conflictWith && "border-amber-300 dark:border-amber-800",
                      )}
                    >
                      <p className="text-[11px] font-semibold tabular-nums text-primary">{schedule.startTime}–{schedule.endTime}</p>
                      <p className="mt-2 text-xs font-semibold leading-4">{schedule.courseName}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{schedule.courseCode} · {schedule.className}</p>
                      <p className="mt-2 flex items-start gap-1 text-[10px] leading-4 text-muted-foreground"><MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />{schedule.room}</p>
                      {highlight && <div className="mt-2"><ScheduleBadge highlight={highlight} /></div>}
                      {schedule.conflictWith && <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-amber-700 dark:text-amber-300"><AlertTriangle className="size-3" aria-hidden="true" />Bentrok</p>}
                    </button>
                  )
                })}
                {schedulesByDay[day.key].length === 0 && <p className="py-8 text-center text-xs text-muted-foreground">Tidak ada kelas</p>}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section aria-label={`Jadwal hari ${selectedDayLabel}`} className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <div><h3 className="font-semibold">{selectedDayLabel}</h3><p className="mt-1 text-xs text-muted-foreground">{selectedSchedules.length} kelas terjadwal</p></div>
          </div>
          {selectedSchedules.length ? selectedSchedules.map((schedule) => (
            <ScheduleListCard key={schedule.id} schedule={schedule} highlight={getHighlight(schedule)} onSelect={setSelectedSchedule} />
          )) : <EmptySchedule dayLabel={selectedDayLabel} />}
        </section>
      )}

      <Dialog open={Boolean(selectedSchedule)} onOpenChange={(open) => !open && setSelectedSchedule(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedSchedule && (
            <>
              <DialogHeader>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{selectedSchedule.courseCode}</Badge>
                  <Badge variant="outline">{selectedSchedule.credits} SKS</Badge>
                  <ScheduleBadge highlight={getHighlight(selectedSchedule)} />
                </div>
                <DialogTitle className="text-lg leading-6">{selectedSchedule.courseName}</DialogTitle>
                <DialogDescription>Pertemuan ke-{selectedSchedule.meeting} · Kelas {selectedSchedule.className}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Waktu", value: `${scheduleDays.find((day) => day.key === selectedSchedule.day)?.label}, ${selectedSchedule.startTime}–${selectedSchedule.endTime} WIB`, icon: Clock3 },
                  { label: "Ruangan", value: selectedSchedule.room, icon: MapPin },
                  { label: "Dosen", value: selectedSchedule.lecturer, icon: UserRound },
                  { label: "Perkuliahan", value: selectedSchedule.deliveryMode, icon: selectedSchedule.deliveryMode === "Daring" ? MonitorUp : BookOpen },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-xl border bg-muted/20 p-3">
                    <p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" aria-hidden="true" />{label}</p>
                    <p className="mt-2 text-sm font-medium leading-5">{value}</p>
                  </div>
                ))}
              </div>
              {selectedSchedule.conflictWith && (
                <Alert className="border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle aria-hidden="true" />
                  <AlertTitle>Jadwal bentrok</AlertTitle>
                  <AlertDescription className="text-amber-800 dark:text-amber-300">Waktu kuliah ini sama dengan {selectedSchedule.conflictWith}. <Link to="/mahasiswa/krs" className="font-semibold underline underline-offset-4">Periksa KRS</Link></AlertDescription>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
