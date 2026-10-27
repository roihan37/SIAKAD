import { useEffect, useMemo, useState } from "react"
import {
  CalendarDays,
  CalendarRange,
  ChevronRight,
  Clock3,
  GraduationCap,
  List,
  MapPin,
  RefreshCw,
  UserRound,
} from "lucide-react"
import { getMySchedule, studentScheduleErrorMessage } from "@/api/student-schedule"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { StudentScheduleDay, StudentScheduleItem, StudentScheduleResponse } from "@/types/student-schedule"

type ScheduleView = "weekly" | "list"
type ScheduleHighlight = "ongoing" | "next" | null

const days: Array<{ key: StudentScheduleDay; label: string; shortLabel: string }> = [
  { key: "SENIN", label: "Senin", shortLabel: "Sen" },
  { key: "SELASA", label: "Selasa", shortLabel: "Sel" },
  { key: "RABU", label: "Rabu", shortLabel: "Rab" },
  { key: "KAMIS", label: "Kamis", shortLabel: "Kam" },
  { key: "JUMAT", label: "Jumat", shortLabel: "Jum" },
  { key: "SABTU", label: "Sabtu", shortLabel: "Sab" },
]

const jsDay: Array<StudentScheduleDay | null> = [null, "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"]

function formatTime(value: string) {
  return value.slice(0, 5).replace(":", ".")
}

function minutesFromTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number)
  return hours * 60 + minutes
}

function roomLabel(schedule: StudentScheduleItem) {
  return [schedule.room.code, schedule.room.name, schedule.room.building].filter(Boolean).join(" · ")
}

function ScheduleBadge({ highlight }: { highlight: ScheduleHighlight }) {
  if (!highlight) return null
  return (
    <Badge variant="outline" className={cn(highlight === "ongoing" ? "border-emerald-300 text-emerald-700" : "border-blue-300 text-blue-700")}>
      {highlight === "ongoing" ? "Sedang Berlangsung" : "Berikutnya"}
    </Badge>
  )
}

function LoadingState() {
  return <div className="space-y-4"><Skeleton className="h-36 w-full rounded-2xl" /><Skeleton className="h-14 w-full rounded-xl" /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl" /></div></div>
}

export default function MahasiswaJadwalPage() {
  const now = useMemo(() => new Date(), [])
  const today = jsDay[now.getDay()]
  const [data, setData] = useState<StudentScheduleResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<StudentScheduleDay>(today ?? "SENIN")
  const [view, setView] = useState<ScheduleView>("list")
  const [selectedSchedule, setSelectedSchedule] = useState<StudentScheduleItem | null>(null)

  const loadSchedule = async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getMySchedule())
    } catch (loadError) {
      setError(studentScheduleErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getMySchedule()
      .then((schedule) => { if (active) setData(schedule) })
      .catch((loadError) => { if (active) setError(studentScheduleErrorMessage(loadError)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const schedulesByDay = useMemo(() => {
    const grouped: Record<StudentScheduleDay, StudentScheduleItem[]> = {
      SENIN: [],
      SELASA: [],
      RABU: [],
      KAMIS: [],
      JUMAT: [],
      SABTU: [],
    }
    for (const schedule of data?.schedules ?? []) grouped[schedule.day].push(schedule)
    for (const day of days) grouped[day.key].sort((a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime))
    return grouped
  }, [data])

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const nextScheduleId = today
    ? schedulesByDay[today].find((schedule) => minutesFromTime(schedule.startTime) > currentMinutes)?.id
    : undefined
  const highlightFor = (schedule: StudentScheduleItem): ScheduleHighlight => {
    if (!today || schedule.day !== today) return null
    const start = minutesFromTime(schedule.startTime)
    const end = minutesFromTime(schedule.endTime)
    if (currentMinutes >= start && currentMinutes < end) return "ongoing"
    return schedule.id === nextScheduleId ? "next" : null
  }

  if (loading) return <main className="mx-auto w-full max-w-7xl py-5 sm:py-7"><LoadingState /></main>
  if (error || !data) return <main className="mx-auto w-full max-w-7xl py-5 sm:py-7"><Card><CardContent className="flex min-h-64 flex-col items-center justify-center text-center"><CalendarDays className="size-10 text-muted-foreground" /><h1 className="mt-4 text-lg font-semibold">Jadwal tidak dapat dimuat</h1><p className="mt-1 max-w-md text-sm text-muted-foreground">{error ?? "Data jadwal tidak tersedia."}</p><Button className="mt-5" onClick={() => void loadSchedule()}><RefreshCw />Coba Lagi</Button></CardContent></Card></main>

  const selectedSchedules = schedulesByDay[selectedDay]
  const selectedDayLabel = days.find((day) => day.key === selectedDay)?.label ?? selectedDay

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 md:pb-7">
      <header className="overflow-hidden rounded-2xl border bg-card">
        <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-7">
          <div><p className="text-sm font-medium text-primary">Agenda perkuliahanmu</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Jadwal Kuliah</h1><p className="mt-2 text-sm text-muted-foreground">Jadwal dari mata kuliah KRS yang telah disetujui.</p></div>
          <div className="inline-flex w-fit rounded-xl bg-muted p-1">
            <Button type="button" size="sm" variant={view === "weekly" ? "default" : "ghost"} onClick={() => setView("weekly")}><CalendarRange />Mingguan</Button>
            <Button type="button" size="sm" variant={view === "list" ? "default" : "ghost"} onClick={() => setView("list")}><List />Daftar</Button>
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <span className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" />Tahun Akademik <strong>{data.academicYear.year}</strong></span>
          <span className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" />Semester <strong>{data.academicYear.semester === "GANJIL" ? "Ganjil" : "Genap"}</strong></span>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Jadwal Semester</h2><p className="text-sm text-muted-foreground">Waktu ditampilkan dalam WIB</p></div>{today && <Button variant="outline" size="sm" onClick={() => setSelectedDay(today)}><CalendarDays />Hari Ini</Button>}</div>
        <div className="overflow-x-auto pb-1" role="tablist">
          <div className="flex min-w-max gap-2 sm:grid sm:min-w-0 sm:grid-cols-6">
            {days.map((day) => <button key={day.key} type="button" role="tab" aria-selected={selectedDay === day.key} onClick={() => setSelectedDay(day.key)} className={cn("min-w-20 rounded-xl border bg-card px-3 py-2.5 text-center", selectedDay === day.key && "border-primary bg-primary text-primary-foreground")}><span className="block text-xs font-semibold sm:hidden">{day.shortLabel}</span><span className="hidden text-xs font-semibold sm:block">{day.label}</span><span className="mt-1 block text-[10px] opacity-75">{day.key === today ? "Hari ini" : `${schedulesByDay[day.key].length} kelas`}</span></button>)}
          </div>
        </div>
      </section>

      {!data.schedules.length ? (
        <Card><CardContent className="flex min-h-56 flex-col items-center justify-center text-center"><CalendarDays className="size-10 text-muted-foreground" /><h2 className="mt-4 font-semibold">Belum ada jadwal kuliah</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Jadwal akan tampil setelah mata kuliah KRS disetujui dan memiliki jadwal.</p></CardContent></Card>
      ) : view === "weekly" ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => <Card key={day.key} className={cn(day.key === today && "border-primary/40")}><CardContent><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{day.label}</h3><Badge variant="secondary">{schedulesByDay[day.key].length}</Badge></div><div className="space-y-2">{schedulesByDay[day.key].map((schedule) => <button key={schedule.id} type="button" onClick={() => setSelectedSchedule(schedule)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/30"><p className="text-xs font-semibold text-primary">{formatTime(schedule.startTime)}–{formatTime(schedule.endTime)}</p><p className="mt-2 text-sm font-semibold">{schedule.course.name}</p><p className="mt-1 text-xs text-muted-foreground">{schedule.course.code} · Kelas {schedule.class.name}</p><p className="mt-2 flex gap-1 text-xs text-muted-foreground"><MapPin className="size-3.5 shrink-0" />{roomLabel(schedule)}</p><div className="mt-2"><ScheduleBadge highlight={highlightFor(schedule)} /></div></button>)}{!schedulesByDay[day.key].length && <p className="py-8 text-center text-xs text-muted-foreground">Tidak ada kelas</p>}</div></CardContent></Card>)}
        </section>
      ) : (
        <section className="space-y-3"><div><h3 className="font-semibold">{selectedDayLabel}</h3><p className="text-xs text-muted-foreground">{selectedSchedules.length} kelas terjadwal</p></div>{selectedSchedules.map((schedule) => <button key={schedule.id} type="button" onClick={() => setSelectedSchedule(schedule)} className="group w-full rounded-2xl border bg-card p-4 text-left hover:bg-muted/20"><div className="flex items-start gap-4"><div className="w-20 shrink-0"><p className="font-semibold">{formatTime(schedule.startTime)}</p><p className="text-xs text-muted-foreground">s.d. {formatTime(schedule.endTime)}</p></div><div className="min-w-0 flex-1 border-l pl-4"><div className="flex flex-wrap justify-between gap-2"><div><p className="font-semibold">{schedule.course.name}</p><p className="mt-1 text-xs text-muted-foreground">{schedule.course.code} · {schedule.course.credits} SKS · Kelas {schedule.class.name}</p></div><ScheduleBadge highlight={highlightFor(schedule)} /></div><div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2"><span className="flex gap-2"><MapPin className="size-3.5" />{roomLabel(schedule)}</span><span className="flex gap-2"><UserRound className="size-3.5" />{schedule.lecturer.name}</span></div></div><ChevronRight className="size-4 text-muted-foreground" /></div></button>)}{!selectedSchedules.length && <Card><CardContent className="flex min-h-48 flex-col items-center justify-center text-center"><CalendarDays className="size-9 text-muted-foreground" /><p className="mt-3 font-medium">Tidak ada jadwal pada hari {selectedDayLabel}</p></CardContent></Card>}</section>
      )}

      <Dialog open={Boolean(selectedSchedule)} onOpenChange={(open) => { if (!open) setSelectedSchedule(null) }}>
        <DialogContent>{selectedSchedule && <><DialogHeader><Badge variant="secondary" className="w-fit">{selectedSchedule.course.code}</Badge><DialogTitle>{selectedSchedule.course.name}</DialogTitle><DialogDescription>{selectedSchedule.course.credits} SKS · Kelas {selectedSchedule.class.name}</DialogDescription></DialogHeader><div className="grid gap-3 text-sm"><p className="flex items-center gap-2"><Clock3 className="size-4 text-muted-foreground" />{days.find((day) => day.key === selectedSchedule.day)?.label}, {formatTime(selectedSchedule.startTime)}–{formatTime(selectedSchedule.endTime)} WIB</p><p className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{roomLabel(selectedSchedule)}</p><p className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" />{selectedSchedule.lecturer.name}</p></div></>}</DialogContent>
      </Dialog>
    </main>
  )
}
