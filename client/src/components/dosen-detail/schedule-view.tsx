import { days, dayLabel, minutes } from "@/lib/lecturer-schedule"
import { useState } from "react"
import { CalendarDays, Clock3, LayoutGrid, List, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ScheduleData } from "@/types/lecturer-tabs"
import { EmptyTab } from "./remote-tab"

export function ScheduleView({ jadwal }: Pick<ScheduleData, "jadwal">) {
  const [view, setView] = useState<"list" | "calendar">("list")
  if (!jadwal.length) return <EmptyTab>Belum ada jadwal mengajar pada tahun akademik ini.</EmptyTab>
  const startHour = Math.min(7, ...jadwal.map((item) => Math.floor(minutes(item.jamMulai) / 60)))
  const endHour = Math.max(16, ...jadwal.map((item) => Math.ceil(minutes(item.jamSelesai) / 60)))
  const height = (endHour - startHour) * 64
  return <div className="space-y-4"><div role="group" aria-label="Tampilan jadwal" className="flex w-fit gap-1 rounded-lg border p-1"><Button size="sm" variant={view === "list" ? "secondary" : "ghost"} aria-pressed={view === "list"} onClick={() => setView("list")}><List /> List</Button><Button size="sm" variant={view === "calendar" ? "secondary" : "ghost"} aria-pressed={view === "calendar"} onClick={() => setView("calendar")}><LayoutGrid /> Kalender</Button></div>
    {view === "list" ? <div className="space-y-4">{days.filter((day) => jadwal.some((item) => item.hari === day)).map((day) => <section key={day} className="rounded-xl border"><h3 className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3 text-sm font-semibold"><CalendarDays className="size-4 text-primary" />{dayLabel(day)}</h3>{jadwal.filter((item) => item.hari === day).map((item) => <div key={item.id} className="grid gap-3 border-b p-4 last:border-0 sm:grid-cols-[160px_1fr_auto]"><p className="flex items-center gap-2 text-sm"><Clock3 className="size-4" />{item.jamMulai}–{item.jamSelesai}</p><div><p className="font-medium">{item.mataKuliah.nama}</p><p className="mt-1 text-xs text-muted-foreground">{item.mataKuliah.kode} · {item.kelas.nama}</p></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4" />{item.ruangan.nama}</p></div>)}</section>)}</div> : <div className="overflow-x-auto rounded-xl border"><div className="min-w-[1100px]"><div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b bg-muted/30"><span className="p-3 text-xs">WIB</span>{days.map((day) => <h3 key={day} className="border-l p-3 text-center text-sm font-semibold">{dayLabel(day)}</h3>)}</div><div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]"><div className="relative" style={{ height }}>{Array.from({ length: endHour - startHour }, (_, index) => <span key={index} style={{ top: index * 64 }} className="absolute left-2 text-xs text-muted-foreground">{String(index + startHour).padStart(2, "0")}:00</span>)}</div>{days.map((day) => <div key={day} className="relative border-l bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_63px,var(--color-border)_63px,var(--color-border)_64px)]" style={{ height }}>{jadwal.filter((item) => item.hari === day).map((item) => {
      // Give overlapping appointments separate lanes so no class becomes hidden.
      const dayItems = jadwal.filter((other) => other.hari === day)
      const laneEnds: number[] = []
      const lanes = new Map<number, number>()
      for (const appointment of [...dayItems].sort((a, b) => minutes(a.jamMulai) - minutes(b.jamMulai))) {
        const free = laneEnds.findIndex((end) => end <= minutes(appointment.jamMulai))
        const lane = free === -1 ? laneEnds.length : free
        laneEnds[lane] = minutes(appointment.jamSelesai)
        lanes.set(appointment.id, lane)
      }
      const lane = lanes.get(item.id) ?? 0
      return <article key={item.id} style={{ top: (minutes(item.jamMulai) / 60 - startHour) * 64, height: Math.max(32, (minutes(item.jamSelesai) - minutes(item.jamMulai)) / 60 * 64), left: `${lane / laneEnds.length * 100}%`, width: `${100 / laneEnds.length}%` }} className="absolute overflow-auto rounded-lg border border-primary/20 bg-primary/10 p-2 text-xs"><p className="font-semibold text-primary">{item.jamMulai}–{item.jamSelesai}</p><h4 className="mt-2 font-semibold">{item.mataKuliah.nama}</h4><p className="mt-1">{item.kelas.nama} · {item.ruangan.nama}</p></article>
    })}</div>)}</div></div></div>}
  </div>
}
