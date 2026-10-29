import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Database,
  FileCheck2,
  GraduationCap,
  MapPin,
  MessageSquareText,
  UsersRound,
} from "lucide-react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Summary = {
  label: string
  value: string
  note: string
  icon: LucideIcon
  tone: string
}

const summaries: Summary[] = [
  { label: "Kelas Diampu", value: "4", note: "Semester aktif", icon: BookOpenCheck, tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  { label: "Beban Mengajar", value: "12 SKS", note: "4 mata kuliah", icon: GraduationCap, tone: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  { label: "Mahasiswa PA", value: "18", note: "Mahasiswa aktif", icon: UsersRound, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { label: "KRS Menunggu", value: "6", note: "Perlu ditinjau", icon: ClipboardCheck, tone: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
]

const quickActions = [
  { label: "Isi Presensi", description: "Catat kehadiran kelas", path: "/dosen/presensi", icon: ClipboardList },
  { label: "Review KRS", description: "Tinjau pengajuan mahasiswa", path: "/dosen/persetujuan-krs", icon: ClipboardCheck },
  { label: "Input Nilai", description: "Lengkapi nilai kelas", path: "/dosen/nilai", icon: FileCheck2 },
  { label: "Bimbingan", description: "Tinjau progres skripsi", path: "/dosen/bimbingan-skripsi", icon: MessageSquareText },
]

const todaySchedules = [
  { id: 1, time: "08.00–09.40", course: "Algoritma dan Pemrograman", code: "IF201", className: "TI-2A", room: "Lab Komputer 2", status: "Berlangsung", canAttend: true },
  { id: 2, time: "10.00–11.40", course: "Struktur Data", code: "IF203", className: "TI-2B", room: "Ruang B-204", status: "Berikutnya", canAttend: true },
  { id: 3, time: "13.00–14.40", course: "Rekayasa Perangkat Lunak", code: "IF305", className: "TI-3A", room: "Ruang C-301", status: "Berikutnya", canAttend: false },
]

const actionsNeeded = [
  { label: "KRS menunggu persetujuan", count: "6 mahasiswa", path: "/dosen/persetujuan-krs", icon: ClipboardCheck, tone: "text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950" },
  { label: "Presensi belum diisi", count: "1 pertemuan", path: "/dosen/presensi", icon: ClipboardList, tone: "text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950" },
  { label: "Nilai belum lengkap", count: "2 kelas", path: "/dosen/nilai", icon: FileCheck2, tone: "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950" },
  { label: "Bimbingan menunggu review", count: "3 mahasiswa", path: "/dosen/bimbingan-skripsi", icon: MessageSquareText, tone: "text-violet-700 bg-violet-50 dark:text-violet-300 dark:bg-violet-950" },
]

const classes = [
  { id: 1, code: "IF201", course: "Algoritma dan Pemrograman", className: "TI-2A", students: 32, schedule: "Senin, 08.00–09.40" },
  { id: 2, code: "IF203", course: "Struktur Data", className: "TI-2B", students: 30, schedule: "Senin, 10.00–11.40" },
  { id: 3, code: "IF305", course: "Rekayasa Perangkat Lunak", className: "TI-3A", students: 28, schedule: "Senin, 13.00–14.40" },
  { id: 4, code: "IF402", course: "Manajemen Proyek TI", className: "TI-4A", students: 26, schedule: "Rabu, 09.50–11.30" },
]

const scheduleStatusStyles: Record<string, string> = {
  Berlangsung: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Berikutnya: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
}

function SectionHeader({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <CardHeader className="gap-1.5 border-b border-border/70 pb-4">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-0.5 text-xs sm:text-sm">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  )
}

export default function DosenDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-muted-foreground">Selamat datang,</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Dr. Budi Santoso</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Berikut agenda mengajar dan aktivitas akademik yang perlu Anda tindak lanjuti.</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm">
                <span className="font-medium">Teknik Informatika</span>
                <span className="text-muted-foreground">Tahun Akademik 2026/2027 Ganjil</span>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <Database aria-hidden="true" /> Data Dummy
            </Badge>
          </div>
        </div>
        <div className="flex items-start gap-2 border-t border-amber-200 bg-amber-50/80 px-5 py-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 sm:px-7">
          <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>Seluruh informasi pada dashboard ini merupakan data dummy untuk pratinjau tampilan dan belum terhubung ke API.</p>
        </div>
      </header>

      <section aria-labelledby="summary-title">
        <h2 id="summary-title" className="sr-only">Ringkasan dosen</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 xl:gap-4">
          {summaries.map(({ label, value, note, icon: Icon, tone }) => (
            <Card key={label} className="gap-3">
              <CardContent className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{note}</p>
                </div>
                <span className={cn("hidden size-10 shrink-0 items-center justify-center rounded-xl sm:flex", tone)}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="quick-action-title">
        <h2 id="quick-action-title" className="mb-3 text-base font-semibold">Aksi Cepat</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map(({ label, description, path, icon: Icon }) => (
            <Button key={label} nativeButton={false} variant="outline" className="h-auto justify-start gap-3 px-4 py-3 text-left" render={<Link to={path} />}>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block font-medium">{label}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{description}</span>
              </span>
              <ArrowRight className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
            </Button>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)] xl:gap-6">
        <Card>
          <SectionHeader icon={CalendarDays} title="Jadwal Hari Ini" description="3 kelas terjadwal hari ini" />
          <CardContent>
            <ol className="divide-y divide-border/70">
              {todaySchedules.map((item) => (
                <li key={item.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[7rem_minmax(0,1fr)_auto] md:items-center md:gap-5">
                  <div className="flex items-center justify-between gap-3 md:block">
                    <p className="flex items-center gap-1.5 text-xs font-medium tabular-nums sm:text-sm">
                      <Clock3 className="size-3.5 text-muted-foreground" aria-hidden="true" /> {item.time}
                    </p>
                    <Badge variant="outline" className={cn("md:mt-2", scheduleStatusStyles[item.status])}>{item.status}</Badge>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium leading-5">{item.course}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.code} · Kelas {item.className}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden="true" /> {item.room}
                    </p>
                  </div>
                  {item.canAttend && (
                    <Button nativeButton={false} size="sm" variant={item.status === "Berlangsung" ? "default" : "outline"} className="w-full md:w-auto" render={<Link to="/dosen/presensi" />}>
                      Catat Presensi
                    </Button>
                  )}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <SectionHeader icon={ClipboardCheck} title="Perlu Tindakan" description="Prioritas yang perlu diselesaikan" />
          <CardContent>
            <div className="space-y-2.5">
              {actionsNeeded.map(({ label, count, path, icon: Icon, tone }) => (
                <Link key={label} to={path} className="flex items-center gap-3 rounded-xl border border-border/70 p-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", tone)}>
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{count}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <SectionHeader icon={BookOpenCheck} title="Kelas Saya" description="Kelas yang diampu pada semester aktif" />
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {classes.map((item) => (
              <article key={item.id} className="rounded-xl border border-border/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Badge variant="secondary">{item.code}</Badge>
                    <h3 className="mt-2 font-medium leading-5">{item.course}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Kelas {item.className}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <UsersRound className="size-3.5" aria-hidden="true" /> {item.students}
                  </span>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden="true" /> {item.schedule}
                </p>
                <Button nativeButton={false} variant="outline" size="sm" className="mt-4 w-full sm:w-auto" render={<Link to="/dosen/kelas-mata-kuliah" />}>
                  Buka Kelas <ArrowRight />
                </Button>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-label="Ringkasan aktivitas akademik">
        <Card>
          <CardHeader>
            <CardTitle>Persetujuan KRS</CardTitle>
            <CardDescription>Pengajuan mahasiswa PA</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">6 <span className="text-sm font-normal text-muted-foreground">menunggu</span></p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>12 sudah ditinjau</span><span>18 total</span>
            </div>
            <Button nativeButton={false} variant="outline" size="sm" className="mt-4 w-full" render={<Link to="/dosen/persetujuan-krs" />}>Review KRS <ArrowRight /></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bimbingan Skripsi</CardTitle>
            <CardDescription>Progres mahasiswa bimbingan</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">3 <span className="text-sm font-normal text-muted-foreground">perlu review</span></p>
            <p className="mt-4 text-xs text-muted-foreground">Dari 8 mahasiswa bimbingan aktif</p>
            <Button nativeButton={false} variant="outline" size="sm" className="mt-4 w-full" render={<Link to="/dosen/bimbingan-skripsi" />}>Lihat Bimbingan <ArrowRight /></Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Nilai</CardTitle>
            <CardDescription>Kelengkapan nilai kelas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Sudah lengkap</span><span className="flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" /> 2 kelas</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Belum lengkap</span><span className="font-medium text-amber-700 dark:text-amber-300">2 kelas</span></div>
            </div>
            <Button nativeButton={false} variant="outline" size="sm" className="mt-4 w-full" render={<Link to="/dosen/nilai" />}>Input Nilai <ArrowRight /></Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
