import { useMemo, useState } from "react"
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Database,
  GraduationCap,
  MapPin,
  RotateCcw,
  Search,
  UserRound,
  UsersRound,
} from "lucide-react"
import { Link } from "react-router"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type DetailTab = "overview" | "students" | "attendance" | "grades"

type StudentPreview = {
  nim: string
  name: string
  cohort: number
  status: "Aktif" | "Cuti"
}

type LecturerClass = {
  id: number
  academicYear: string
  courseCode: string
  courseName: string
  credits: number
  className: string
  lecturer: string
  schedule: string
  room: string
  totalStudents: number
  meetingsCompleted: number
  totalMeetings: number
  attendanceRate: number
  attendancePending: number
  gradedStudents: number
  gradeComponentsCompleted: number
  totalGradeComponents: number
  nextAgenda: string
}

const activeAcademicYear = "2026/2027 Ganjil"
const academicYears = [activeAcademicYear, "2025/2026 Genap"]

const studentPreview: StudentPreview[] = [
  { nim: "231011001", name: "Alya Putri Ramadhani", cohort: 2023, status: "Aktif" },
  { nim: "231011007", name: "Dimas Arya Pratama", cohort: 2023, status: "Aktif" },
  { nim: "231011014", name: "Nabila Rahmawati", cohort: 2023, status: "Aktif" },
  { nim: "231011021", name: "Rizky Maulana", cohort: 2023, status: "Cuti" },
  { nim: "231011028", name: "Salsabila Nur Azizah", cohort: 2023, status: "Aktif" },
]

const lecturerClasses: LecturerClass[] = [
  { id: 1, academicYear: activeAcademicYear, courseCode: "IF201", courseName: "Algoritma dan Pemrograman", credits: 3, className: "TI-2A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Senin, 08.00–09.40", room: "Lab Komputer 2", totalStudents: 32, meetingsCompleted: 9, totalMeetings: 16, attendanceRate: 94, attendancePending: 0, gradedStudents: 26, gradeComponentsCompleted: 3, totalGradeComponents: 4, nextAgenda: "Praktikum pencarian dan pengurutan data" },
  { id: 2, academicYear: activeAcademicYear, courseCode: "IF203", courseName: "Struktur Data", credits: 3, className: "TI-2B", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Senin, 10.00–11.40", room: "Ruang B-204", totalStudents: 30, meetingsCompleted: 9, totalMeetings: 16, attendanceRate: 91, attendancePending: 1, gradedStudents: 30, gradeComponentsCompleted: 3, totalGradeComponents: 4, nextAgenda: "Pembahasan implementasi binary tree" },
  { id: 3, academicYear: activeAcademicYear, courseCode: "IF402", courseName: "Manajemen Proyek TI", credits: 3, className: "TI-4A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Selasa, 09.50–11.30", room: "Ruang C-301", totalStudents: 26, meetingsCompleted: 8, totalMeetings: 16, attendanceRate: 96, attendancePending: 0, gradedStudents: 20, gradeComponentsCompleted: 2, totalGradeComponents: 4, nextAgenda: "Review kemajuan proyek kelompok" },
  { id: 4, academicYear: activeAcademicYear, courseCode: "IF305", courseName: "Rekayasa Perangkat Lunak", credits: 3, className: "TI-3A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Rabu, 13.00–14.40", room: "Ruang C-204", totalStudents: 28, meetingsCompleted: 8, totalMeetings: 16, attendanceRate: 93, attendancePending: 0, gradedStudents: 24, gradeComponentsCompleted: 3, totalGradeComponents: 4, nextAgenda: "Workshop pemodelan kebutuhan perangkat lunak" },
  { id: 5, academicYear: activeAcademicYear, courseCode: "IF207", courseName: "Basis Data", credits: 3, className: "TI-2C", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Kamis, 08.00–09.40", room: "Lab Komputer 1", totalStudents: 31, meetingsCompleted: 9, totalMeetings: 16, attendanceRate: 92, attendancePending: 0, gradedStudents: 27, gradeComponentsCompleted: 3, totalGradeComponents: 4, nextAgenda: "Praktikum normalisasi basis data" },
  { id: 6, academicYear: activeAcademicYear, courseCode: "IF309", courseName: "Interaksi Manusia dan Komputer", credits: 2, className: "TI-3B", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Kamis, 10.00–11.40", room: "Ruang B-202", totalStudents: 29, meetingsCompleted: 8, totalMeetings: 16, attendanceRate: 95, attendancePending: 1, gradedStudents: 22, gradeComponentsCompleted: 2, totalGradeComponents: 4, nextAgenda: "Presentasi hasil usability testing" },
  { id: 7, academicYear: activeAcademicYear, courseCode: "IF311", courseName: "Pemrograman Web", credits: 3, className: "TI-3A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Kamis, 13.00–15.30", room: "Lab Komputer 3", totalStudents: 28, meetingsCompleted: 8, totalMeetings: 16, attendanceRate: 90, attendancePending: 0, gradedStudents: 18, gradeComponentsCompleted: 2, totalGradeComponents: 4, nextAgenda: "Praktikum integrasi REST API" },
  { id: 8, academicYear: activeAcademicYear, courseCode: "IF405", courseName: "Kecerdasan Buatan", credits: 3, className: "TI-4B", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Jumat, 09.00–10.40", room: "Ruang C-305", totalStudents: 25, meetingsCompleted: 7, totalMeetings: 16, attendanceRate: 97, attendancePending: 0, gradedStudents: 19, gradeComponentsCompleted: 2, totalGradeComponents: 4, nextAgenda: "Studi kasus algoritma pencarian heuristik" },
  { id: 9, academicYear: "2025/2026 Genap", courseCode: "IF203", courseName: "Struktur Data", credits: 3, className: "TI-2A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Selasa, 08.00–09.40", room: "Ruang B-201", totalStudents: 29, meetingsCompleted: 16, totalMeetings: 16, attendanceRate: 93, attendancePending: 0, gradedStudents: 29, gradeComponentsCompleted: 4, totalGradeComponents: 4, nextAgenda: "Perkuliahan telah selesai" },
  { id: 10, academicYear: "2025/2026 Genap", courseCode: "IF305", courseName: "Rekayasa Perangkat Lunak", credits: 3, className: "TI-3B", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Rabu, 10.00–11.40", room: "Ruang C-202", totalStudents: 27, meetingsCompleted: 16, totalMeetings: 16, attendanceRate: 95, attendancePending: 0, gradedStudents: 27, gradeComponentsCompleted: 4, totalGradeComponents: 4, nextAgenda: "Perkuliahan telah selesai" },
]

const detailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Mahasiswa" },
  { id: "attendance", label: "Presensi" },
  { id: "grades", label: "Nilai" },
]

function ProgressBar({ value, label }: { value: number; label: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${value}%` }} />
    </div>
  )
}

function ClassDetail({ item, activeTab, onTabChange }: { item: LecturerClass; activeTab: DetailTab; onTabChange: (tab: DetailTab) => void }) {
  const meetingProgress = Math.round((item.meetingsCompleted / item.totalMeetings) * 100)
  const gradeProgress = Math.round((item.gradedStudents / item.totalStudents) * 100)

  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <Badge variant="secondary">{item.courseCode}</Badge>
          <span className="text-xs text-muted-foreground">{item.credits} SKS · Kelas {item.className}</span>
        </div>
        <DialogTitle className="text-lg sm:text-xl">{item.courseName}</DialogTitle>
        <DialogDescription>Detail kelas yang Anda ampu pada Tahun Akademik {item.academicYear}.</DialogDescription>
      </DialogHeader>

      <dl className="grid gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted-foreground">Dosen</dt><dd className="mt-1 font-medium">{item.lecturer}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Jadwal</dt><dd className="mt-1 font-medium">{item.schedule}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Ruangan</dt><dd className="mt-1 font-medium">{item.room}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Mahasiswa</dt><dd className="mt-1 font-medium">{item.totalStudents} mahasiswa</dd></div>
      </dl>

      <div className="overflow-x-auto" role="tablist" aria-label="Detail kelas">
        <div className="inline-flex min-w-full gap-1 rounded-xl bg-muted p-1 sm:min-w-0">
          {detailTabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => onTabChange(tab.id)} className={cn("min-w-max flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-64 overflow-y-auto pr-1 sm:max-h-[42vh]" role="tabpanel">
        {activeTab === "overview" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Progres Pertemuan</p><strong className="text-sm">{item.meetingsCompleted}/{item.totalMeetings}</strong></div>
              <div className="mt-3"><ProgressBar value={meetingProgress} label="Progres pertemuan" /></div>
              <p className="mt-2 text-xs text-muted-foreground">{meetingProgress}% pertemuan telah terlaksana.</p>
            </div>
            <div className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="size-4 text-primary" aria-hidden="true" /> Agenda Berikutnya</div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.nextAgenda}</p>
            </div>
            <div className="rounded-xl border border-border/70 p-4 sm:col-span-2">
              <h3 className="text-sm font-medium">Aktivitas Akademik</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Kehadiran</p><p className="mt-1 text-lg font-semibold">{item.attendanceRate}%</p></div>
                <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Nilai Terinput</p><p className="mt-1 text-lg font-semibold">{item.gradedStudents}/{item.totalStudents}</p></div>
                <div className="rounded-lg bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Komponen Nilai</p><p className="mt-1 text-lg font-semibold">{item.gradeComponentsCompleted}/{item.totalGradeComponents}</p></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-medium">Daftar Mahasiswa</h3><p className="mt-0.5 text-xs text-muted-foreground">Pratinjau 5 dari {item.totalStudents} mahasiswa.</p></div><Badge variant="secondary">{item.totalStudents} mahasiswa</Badge></div>
            <div className="grid gap-2">
              {studentPreview.map((student) => (
                <div key={student.nim} className="flex flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.nim} · Angkatan {student.cohort}</p></div></div>
                  <Badge variant={student.status === "Aktif" ? "secondary" : "outline"}>{student.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 p-4"><p className="text-xs text-muted-foreground">Pertemuan Terisi</p><p className="mt-1 text-xl font-semibold">{item.meetingsCompleted - item.attendancePending}/{item.meetingsCompleted}</p></div>
              <div className="rounded-xl border border-border/70 p-4"><p className="text-xs text-muted-foreground">Rata-rata Kehadiran</p><p className="mt-1 text-xl font-semibold">{item.attendanceRate}%</p></div>
              <div className="rounded-xl border border-border/70 p-4"><p className="text-xs text-muted-foreground">Belum Diisi</p><p className="mt-1 text-xl font-semibold">{item.attendancePending}</p></div>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4"><div className="flex items-center gap-2 font-medium"><ClipboardCheck className="size-4 text-primary" aria-hidden="true" /> Kelola Presensi</div><p className="mt-2 text-sm text-muted-foreground">Buka halaman Presensi untuk mencatat atau meninjau kehadiran setiap pertemuan kelas ini.</p><Button nativeButton={false} className="mt-4 w-full sm:w-auto" render={<Link to="/dosen/presensi" />}><ClipboardCheck aria-hidden="true" /> Buka Presensi</Button></div>
          </div>
        )}

        {activeTab === "grades" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/70 p-4">
              <div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Kelengkapan Nilai Mahasiswa</p><strong className="text-sm">{item.gradedStudents}/{item.totalStudents}</strong></div>
              <div className="mt-3"><ProgressBar value={gradeProgress} label="Kelengkapan nilai mahasiswa" /></div>
              <p className="mt-2 text-xs text-muted-foreground">{gradeProgress}% mahasiswa telah memiliki nilai.</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/30 p-4"><div className="flex items-center gap-2 font-medium"><ChartNoAxesColumnIncreasing className="size-4 text-primary" aria-hidden="true" /> Komponen Nilai</div><p className="mt-2 text-sm text-muted-foreground">{item.gradeComponentsCompleted} dari {item.totalGradeComponents} komponen nilai telah dilengkapi.</p><Button nativeButton={false} className="mt-4 w-full sm:w-auto" render={<Link to="/dosen/nilai" />}><GraduationCap aria-hidden="true" /> Buka Pengelolaan Nilai</Button></div>
          </div>
        )}
      </div>
    </>
  )
}

export default function DosenKelasMataKuliahPage() {
  const [academicYear, setAcademicYear] = useState(activeAcademicYear)
  const [courseFilter, setCourseFilter] = useState("ALL")
  const [query, setQuery] = useState("")
  const [selectedClass, setSelectedClass] = useState<LecturerClass | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>("overview")

  const classesByYear = useMemo(() => lecturerClasses.filter((item) => item.academicYear === academicYear), [academicYear])
  const courseOptions = useMemo(() => Array.from(new Map(classesByYear.map((item) => [item.courseCode, item.courseName])), ([code, name]) => ({ code, name })), [classesByYear])
  const summary = useMemo(() => ({
    classes: classesByYear.length,
    courses: new Set(classesByYear.map((item) => item.courseCode)).size,
    students: classesByYear.reduce((total, item) => total + item.totalStudents, 0),
  }), [classesByYear])
  const filteredClasses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")
    return classesByYear.filter((item) => {
      const matchesCourse = courseFilter === "ALL" || item.courseCode === courseFilter
      const matchesQuery = !normalizedQuery || [item.courseName, item.courseCode, item.className].some((value) => value.toLocaleLowerCase("id-ID").includes(normalizedQuery))
      return matchesCourse && matchesQuery
    })
  }, [classesByYear, courseFilter, query])

  const resetFilters = () => {
    setCourseFilter("ALL")
    setQuery("")
  }

  const openClass = (item: LecturerClass) => {
    setActiveTab("overview")
    setSelectedClass(item)
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7 sm:py-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-sm font-medium text-muted-foreground">Perkuliahan</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Kelas &amp; Mata Kuliah</h1><p className="mt-2 text-sm text-muted-foreground">Tahun Akademik {activeAcademicYear}</p></div>
            <Badge variant="outline" className="w-fit border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"><Database aria-hidden="true" /> Data Dummy</Badge>
          </div>
        </div>
        <div className="flex items-start gap-2 border-t border-amber-200 bg-amber-50/80 px-5 py-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 sm:px-7"><Database className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><p>Data kelas dan aktivitas akademik pada halaman ini masih berupa data dummy dan belum terhubung ke API.</p></div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Ringkasan kelas">
        <Card size="sm"><CardContent className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><BookOpen aria-hidden="true" /></span><div><p className="text-xs text-muted-foreground">Total Kelas</p><p className="mt-0.5 text-xl font-semibold">{summary.classes}</p></div></CardContent></Card>
        <Card size="sm"><CardContent className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><GraduationCap aria-hidden="true" /></span><div><p className="text-xs text-muted-foreground">Mata Kuliah Diampu</p><p className="mt-0.5 text-xl font-semibold">{summary.courses}</p></div></CardContent></Card>
        <Card size="sm" className="col-span-2 lg:col-span-1"><CardContent className="flex items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"><UsersRound aria-hidden="true" /></span><div><p className="text-xs text-muted-foreground">Total Mahasiswa</p><p className="mt-0.5 text-xl font-semibold">{summary.students}</p></div></CardContent></Card>
      </section>

      <section className="rounded-xl border border-border/70 bg-card p-4" aria-label="Pencarian dan filter kelas">
        <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_15rem_18rem] lg:items-end">
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Cari kelas<div className="relative"><Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 bg-background pl-9" placeholder="Cari mata kuliah, kode, atau kelas..." /></div></label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Tahun Akademik<Select value={academicYear} onValueChange={(value) => { setAcademicYear(value ?? activeAcademicYear); setCourseFilter("ALL") }}><SelectTrigger className="h-9 w-full bg-background"><SelectValue /></SelectTrigger><SelectContent>{academicYears.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent></Select></label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Mata Kuliah<Select value={courseFilter} onValueChange={(value) => setCourseFilter(value ?? "ALL")}><SelectTrigger className="h-9 w-full bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Mata Kuliah</SelectItem>{courseOptions.map((course) => <SelectItem key={course.code} value={course.code}>{course.code} · {course.name}</SelectItem>)}</SelectContent></Select></label>
        </div>
      </section>

      <section aria-labelledby="class-list-title">
        <div className="mb-3 flex items-end justify-between gap-3"><div><h2 id="class-list-title" className="text-base font-semibold">Kelas yang Anda Ampu</h2><p className="mt-0.5 text-xs text-muted-foreground">{filteredClasses.length} kelas ditemukan pada {academicYear}.</p></div></div>
        {filteredClasses.length === 0 ? (
          <Card><CardContent className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"><BookOpen aria-hidden="true" /></span><h3 className="mt-4 text-base font-semibold">Kelas tidak ditemukan</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">Tidak ada kelas yang cocok dengan kata kunci atau filter mata kuliah yang dipilih.</p><Button variant="outline" className="mt-4" onClick={resetFilters}><RotateCcw aria-hidden="true" /> Reset Filter</Button></CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClasses.map((item) => (
              <Card key={item.id} className="transition-shadow hover:shadow-sm">
                <CardHeader className="border-b border-border/70 pb-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.courseCode}</Badge><span className="text-xs text-muted-foreground">{item.credits} SKS</span></div><CardTitle className="mt-3 line-clamp-2">{item.courseName}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Kelas {item.className}</p></div><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><BookOpen aria-hidden="true" /></span></div></CardHeader>
                <CardContent className="grid gap-3 text-sm"><div className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><p className="font-medium">{item.schedule}</p><p className="text-xs text-muted-foreground">Jadwal mengajar</p></div></div><div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><p className="font-medium">{item.room}</p><p className="text-xs text-muted-foreground">Ruangan</p></div></div><div className="flex items-start gap-2"><UsersRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><p className="font-medium">{item.totalStudents} mahasiswa</p><p className="text-xs text-muted-foreground">Peserta kelas</p></div></div></CardContent>
                <CardFooter><Button className="w-full" onClick={() => openClass(item)}>Lihat Kelas <ChevronRight aria-hidden="true" /></Button></CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={selectedClass !== null} onOpenChange={(open) => !open && setSelectedClass(null)}>
        <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-3xl">
          {selectedClass && <ClassDetail item={selectedClass} activeTab={activeTab} onTabChange={setActiveTab} />}
        </DialogContent>
      </Dialog>
    </main>
  )
}
