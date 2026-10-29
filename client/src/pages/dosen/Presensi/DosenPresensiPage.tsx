import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  Database,
  LoaderCircle,
  MapPin,
  RotateCcw,
  Save,
  UserRound,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type AttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpa"
type AttendanceValue = AttendanceStatus | null
type AttendanceMap = Record<string, AttendanceValue>
type AttendanceFilter = "ALL" | "COMPLETE" | "PENDING"

type Student = {
  nim: string
  name: string
}

type LecturerClass = {
  id: number
  courseCode: string
  courseName: string
  className: string
  lecturer: string
  schedule: string
  room: string
  totalStudents: number
  meetingsCompleted: number
  attendancePending: boolean
}

type MeetingRecord = {
  meeting: number
  date: string
  statuses: AttendanceMap
}

type PendingNavigation =
  | { type: "close" }
  | { type: "meeting"; meeting: number }

const activeAcademicYear = "2026/2027 Ganjil"
const attendanceStatuses: AttendanceStatus[] = ["Hadir", "Izin", "Sakit", "Alpa"]

const initialClasses: LecturerClass[] = [
  { id: 1, courseCode: "IF201", courseName: "Algoritma dan Pemrograman", className: "TI-2A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Senin, 08.00–09.40", room: "Lab Komputer 2", totalStudents: 32, meetingsCompleted: 9, attendancePending: false },
  { id: 2, courseCode: "IF203", courseName: "Struktur Data", className: "TI-2B", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Senin, 10.00–11.40", room: "Ruang B-204", totalStudents: 30, meetingsCompleted: 9, attendancePending: true },
  { id: 3, courseCode: "IF402", courseName: "Manajemen Proyek TI", className: "TI-4A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Selasa, 09.50–11.30", room: "Ruang C-301", totalStudents: 26, meetingsCompleted: 8, attendancePending: false },
  { id: 4, courseCode: "IF305", courseName: "Rekayasa Perangkat Lunak", className: "TI-3A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Rabu, 13.00–14.40", room: "Ruang C-204", totalStudents: 28, meetingsCompleted: 7, attendancePending: true },
  { id: 5, courseCode: "IF207", courseName: "Basis Data", className: "TI-2C", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Kamis, 08.00–09.40", room: "Lab Komputer 1", totalStudents: 31, meetingsCompleted: 8, attendancePending: false },
  { id: 6, courseCode: "IF309", courseName: "Interaksi Manusia dan Komputer", className: "TI-3B", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Kamis, 10.00–11.40", room: "Ruang B-202", totalStudents: 29, meetingsCompleted: 6, attendancePending: true },
]

const studentNames = [
  "Alya Putri Ramadhani", "Dimas Arya Pratama", "Nabila Rahmawati", "Rizky Maulana",
  "Salsabila Nur Azizah", "Fajar Aditya Nugraha", "Intan Permata Sari", "Muhammad Farhan",
  "Citra Ayu Lestari", "Rafi Akbar Prakoso", "Nadia Safitri", "Bagas Dwi Saputra",
  "Zahra Khairunnisa", "Arga Bintang Mahendra", "Keisya Anindita", "Ilham Ramadhan",
  "Putri Maharani", "Daffa Al Ghifari", "Anisa Nur Fadilah", "Galang Pratama",
  "Naura Azzahra", "Reza Fahlevi", "Aulia Rahman", "Syifa Nabila",
  "Aditya Firmansyah", "Vania Oktaviani", "Hafiz Alfarizi", "Tiara Cahyani",
  "Akmal Fauzan", "Mutiara Hanum", "Yoga Kurniawan", "Larasati Dewi",
]

function studentsForClass(item: LecturerClass): Student[] {
  return Array.from({ length: item.totalStudents }, (_, index) => ({
    nim: `${23 + (item.id % 2)}101${String(item.id).padStart(2, "0")}${String(index + 1).padStart(2, "0")}`,
    name: studentNames[index % studentNames.length],
  }))
}

function createAttendance(students: Student[], meeting: number): AttendanceMap {
  return Object.fromEntries(students.map((student, index) => {
    const marker = (index + meeting) % 17
    const status: AttendanceStatus = marker === 0 ? "Alpa" : marker === 5 ? "Izin" : marker === 11 ? "Sakit" : "Hadir"
    return [student.nim, status]
  }))
}

function createInitialHistory(): Record<number, MeetingRecord[]> {
  return Object.fromEntries(initialClasses.map((item) => {
    const students = studentsForClass(item)
    const latestSaved = Math.max(1, item.meetingsCompleted - (item.attendancePending ? 1 : 0))
    return [item.id, [{ meeting: latestSaved, date: `2026-10-${String(8 + item.id).padStart(2, "0")}`, statuses: createAttendance(students, latestSaved) }]]
  }))
}

function statusBadge(status: AttendanceStatus) {
  const styles: Record<AttendanceStatus, string> = {
    Hadir: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    Izin: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    Sakit: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    Alpa: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
  }
  return styles[status]
}

export default function DosenPresensiPage() {
  const [classes, setClasses] = useState(initialClasses)
  const [courseFilter, setCourseFilter] = useState("ALL")
  const [classFilter, setClassFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState<AttendanceFilter>("ALL")
  const [history, setHistory] = useState<Record<number, MeetingRecord[]>>(createInitialHistory)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [manageOpen, setManageOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [meeting, setMeeting] = useState(1)
  const [date, setDate] = useState("2026-10-29")
  const [statuses, setStatuses] = useState<AttendanceMap>({})
  const [baseline, setBaseline] = useState("")
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null)
  const [validationMessage, setValidationMessage] = useState("")

  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? null
  const students = useMemo(() => selectedClass ? studentsForClass(selectedClass) : [], [selectedClass])
  const currentSnapshot = JSON.stringify({ date, statuses })
  const isDirty = manageOpen && !isLoading && baseline !== "" && currentSnapshot !== baseline

  useEffect(() => {
    if (!isDirty) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [isDirty])

  const filteredClasses = useMemo(() => classes.filter((item) => {
    const matchesCourse = courseFilter === "ALL" || item.courseCode === courseFilter
    const matchesClass = classFilter === "ALL" || item.className === classFilter
    const matchesStatus = statusFilter === "ALL"
      || (statusFilter === "PENDING" && item.attendancePending)
      || (statusFilter === "COMPLETE" && !item.attendancePending)
    return matchesCourse && matchesClass && matchesStatus
  }), [classFilter, classes, courseFilter, statusFilter])

  const totalMeetings = classes.reduce((sum, item) => sum + item.meetingsCompleted, 0)
  const pendingClasses = classes.filter((item) => item.attendancePending).length

  const loadMeeting = (classItem: LecturerClass, nextMeeting: number) => {
    const classStudents = studentsForClass(classItem)
    const saved = history[classItem.id]?.find((record) => record.meeting === nextMeeting)
    const nextStatuses: AttendanceMap = saved?.statuses
      ? { ...saved.statuses }
      : Object.fromEntries(classStudents.map((student) => [student.nim, null]))
    const nextDate = saved?.date ?? "2026-10-29"
    setMeeting(nextMeeting)
    setDate(nextDate)
    setStatuses(nextStatuses)
    setBaseline(JSON.stringify({ date: nextDate, statuses: nextStatuses }))
    setValidationMessage("")
  }

  const openManage = (classItem: LecturerClass) => {
    const nextMeeting = classItem.attendancePending
      ? classItem.meetingsCompleted
      : Math.min(16, classItem.meetingsCompleted + 1)
    setSelectedClassId(classItem.id)
    setManageOpen(true)
    setIsLoading(true)
    window.setTimeout(() => {
      loadMeeting(classItem, nextMeeting)
      setIsLoading(false)
    }, 300)
  }

  const requestClose = () => {
    if (isDirty) {
      setPendingNavigation({ type: "close" })
      setDiscardConfirmOpen(true)
      return
    }
    setManageOpen(false)
  }

  const requestMeetingChange = (nextMeeting: number) => {
    if (!selectedClass || nextMeeting === meeting) return
    if (isDirty) {
      setPendingNavigation({ type: "meeting", meeting: nextMeeting })
      setDiscardConfirmOpen(true)
      return
    }
    loadMeeting(selectedClass, nextMeeting)
  }

  const confirmDiscard = () => {
    if (!pendingNavigation) return
    if (pendingNavigation.type === "close") setManageOpen(false)
    else if (selectedClass) loadMeeting(selectedClass, pendingNavigation.meeting)
    setDiscardConfirmOpen(false)
    setPendingNavigation(null)
  }

  const updateStatus = (nim: string, status: AttendanceStatus) => {
    setStatuses((current) => ({ ...current, [nim]: status }))
    setValidationMessage("")
  }

  const requestSave = () => {
    if (!date) {
      setValidationMessage("Tanggal pertemuan wajib dipilih sebelum menyimpan presensi.")
      return
    }
    const unset = students.filter((student) => !statuses[student.nim]).length
    if (unset > 0) {
      setValidationMessage(`${unset} mahasiswa belum memiliki status kehadiran.`)
      return
    }
    setValidationMessage("")
    setSaveConfirmOpen(true)
  }

  const saveAttendance = () => {
    if (!selectedClass) return
    const savedStatuses = { ...statuses }
    setHistory((current) => {
      const records = current[selectedClass.id] ?? []
      const nextRecord: MeetingRecord = { meeting, date, statuses: savedStatuses }
      return {
        ...current,
        [selectedClass.id]: [...records.filter((record) => record.meeting !== meeting), nextRecord]
          .sort((a, b) => b.meeting - a.meeting),
      }
    })
    setClasses((current) => current.map((item) => item.id === selectedClass.id
      ? {
          ...item,
          meetingsCompleted: Math.max(item.meetingsCompleted, meeting),
          attendancePending: item.attendancePending && meeting !== item.meetingsCompleted,
        }
      : item))
    setBaseline(JSON.stringify({ date, statuses: savedStatuses }))
    setSaveConfirmOpen(false)
    toast.success(`Presensi pertemuan ${meeting} berhasil disimpan.`)
  }

  const counts = attendanceStatuses.reduce<Record<AttendanceStatus, number>>((result, status) => {
    result[status] = Object.values(statuses).filter((value) => value === status).length
    return result
  }, { Hadir: 0, Izin: 0, Sakit: 0, Alpa: 0 })

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="gap-1.5 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                <Database className="size-3.5" /> Data Dummy
              </Badge>
              <Badge variant="secondary">Tahun Akademik {activeAcademicYear}</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Presensi</h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">
                Kelola kehadiran mahasiswa untuk kelas yang Anda ampu.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            Perubahan hanya tersimpan selama sesi halaman ini.
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Total Kelas", value: classes.length, detail: "Kelas diampu", icon: BookOpen, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
          { label: "Pertemuan Terlaksana", value: totalMeetings, detail: "Dari seluruh kelas", icon: CalendarDays, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
          { label: "Presensi Belum Diisi", value: pendingClasses, detail: "Perlu ditindaklanjuti", icon: CircleAlert, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-center gap-4 p-4 sm:p-5">
              <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", item.color)}><item.icon className="size-5" /></div>
              <div><p className="text-sm text-muted-foreground">{item.label}</p><p className="text-2xl font-bold">{item.value}</p><p className="text-xs text-muted-foreground">{item.detail}</p></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter kelas</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Select value={courseFilter} onValueChange={(value) => value && setCourseFilter(value)}>
            <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Semua mata kuliah</SelectItem>{classes.map((item) => <SelectItem key={item.courseCode} value={item.courseCode}>{item.courseCode} · {item.courseName}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={(value) => value && setClassFilter(value)}>
            <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Semua kelas</SelectItem>{classes.map((item) => <SelectItem key={item.id} value={item.className}>{item.className}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as AttendanceFilter)}>
            <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Semua status</SelectItem><SelectItem value="PENDING">Belum diisi</SelectItem><SelectItem value="COMPLETE">Sudah diisi</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div><h2 className="text-lg font-semibold">Kelas yang Diampu</h2><p className="text-sm text-muted-foreground">{filteredClasses.length} kelas ditemukan</p></div>
          {(courseFilter !== "ALL" || classFilter !== "ALL" || statusFilter !== "ALL") && <Button variant="ghost" size="sm" onClick={() => { setCourseFilter("ALL"); setClassFilter("ALL"); setStatusFilter("ALL") }}><RotateCcw /> Reset</Button>}
        </div>
        {filteredClasses.length === 0 ? (
          <Card><CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><ClipboardCheck className="mb-3 size-10 text-muted-foreground" /><h3 className="font-semibold">Kelas tidak ditemukan</h3><p className="mt-1 text-sm text-muted-foreground">Ubah filter untuk melihat kelas lainnya.</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredClasses.map((item) => (
              <Card key={item.id} className={cn("overflow-hidden", item.attendancePending && "border-amber-300 dark:border-amber-900")}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><div className="mb-1 flex flex-wrap items-center gap-2"><Badge variant="secondary">{item.courseCode}</Badge><Badge variant={item.attendancePending ? "outline" : "secondary"} className={item.attendancePending ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300" : ""}>{item.attendancePending ? "Belum Diisi" : "Lengkap"}</Badge></div><h3 className="font-semibold leading-snug">{item.courseName}</h3><p className="text-sm text-muted-foreground">Kelas {item.className}</p></div>
                    <div className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-center"><p className="text-sm font-bold text-primary">{item.meetingsCompleted}/16</p><p className="text-[10px] text-muted-foreground">Pertemuan</p></div>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <span className="flex items-center gap-2"><UsersRound className="size-4" /> {item.totalStudents} mahasiswa</span>
                    <span className="flex items-center gap-2"><Clock3 className="size-4" /> {item.schedule}</span>
                    <span className="flex items-center gap-2"><MapPin className="size-4" /> {item.room}</span>
                    <span className="flex items-center gap-2"><UserRound className="size-4" /> {item.lecturer.split(",")[0]}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(item.meetingsCompleted / 16) * 100}%` }} /></div>
                  <Button className="w-full sm:w-auto" onClick={() => openManage(item)}>Kelola Presensi <ChevronRight /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={manageOpen} onOpenChange={(open) => { if (!open) requestClose() }}>
        <DialogContent className="max-h-[94vh] overflow-hidden p-0 sm:max-w-6xl" showCloseButton={!isDirty}>
          {selectedClass && (
            <>
              <DialogHeader className="border-b p-5 pr-12">
                <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{selectedClass.courseCode}</Badge><Badge variant="outline">Kelas {selectedClass.className}</Badge><Badge variant="outline">Data Dummy</Badge></div>
                <DialogTitle className="text-lg sm:text-xl">Kelola Presensi · {selectedClass.courseName}</DialogTitle>
                <DialogDescription>{selectedClass.lecturer} · {selectedClass.schedule} · {selectedClass.room}</DialogDescription>
              </DialogHeader>
              {isLoading ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center gap-3"><LoaderCircle className="size-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Menyiapkan data presensi...</p></div>
              ) : (
                <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_280px] lg:overflow-hidden">
                  <div className="space-y-5 p-4 sm:p-5 lg:overflow-y-auto">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5"><label className="text-sm font-medium">Pertemuan</label><Select value={String(meeting)} onValueChange={(value) => value && requestMeetingChange(Number(value))}><SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 16 }, (_, index) => <SelectItem key={index + 1} value={String(index + 1)}>Pertemuan {index + 1}</SelectItem>)}</SelectContent></Select></div>
                      <div className="space-y-1.5"><label htmlFor="attendance-date" className="text-sm font-medium">Tanggal pertemuan</label><Input id="attendance-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {attendanceStatuses.map((status) => <div key={status} className={cn("rounded-xl border p-3", statusBadge(status))}><p className="text-xs font-medium">{status}</p><p className="text-xl font-bold">{counts[status]}</p></div>)}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div><h3 className="font-semibold">Daftar Mahasiswa</h3><p className="text-sm text-muted-foreground">{students.length} mahasiswa · Pertemuan {meeting}</p></div>
                      <Button variant="outline" onClick={() => { setStatuses(Object.fromEntries(students.map((student) => [student.nim, "Hadir"]))); setValidationMessage("") }}><CheckCircle2 /> Tandai Semua Hadir</Button>
                    </div>

                    {validationMessage && <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{validationMessage}</div>}

                    <div className="hidden overflow-hidden rounded-xl border md:block">
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-12">No.</TableHead><TableHead>NIM</TableHead><TableHead>Nama</TableHead><TableHead className="w-48">Status Kehadiran</TableHead></TableRow></TableHeader>
                        <TableBody>{students.map((student, index) => <TableRow key={student.nim}><TableCell>{index + 1}</TableCell><TableCell className="font-mono text-xs">{student.nim}</TableCell><TableCell className="font-medium">{student.name}</TableCell><TableCell><AttendanceSelect value={statuses[student.nim]} onChange={(value) => updateStatus(student.nim, value)} /></TableCell></TableRow>)}</TableBody>
                      </Table>
                    </div>
                    <div className="space-y-2 md:hidden">
                      {students.map((student, index) => <div key={student.nim} className="rounded-xl border p-3"><div className="mb-3 flex items-start gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">{index + 1}</span><div className="min-w-0"><p className="font-medium">{student.name}</p><p className="font-mono text-xs text-muted-foreground">{student.nim}</p></div></div><AttendanceSelect value={statuses[student.nim]} onChange={(value) => updateStatus(student.nim, value)} /></div>)}
                    </div>
                  </div>

                  <aside className="border-t bg-muted/20 p-4 sm:p-5 lg:overflow-y-auto lg:border-t-0 lg:border-l">
                    <h3 className="font-semibold">Riwayat Pertemuan</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Pilih pertemuan untuk melihat atau mengoreksi data.</p>
                    <div className="mt-4 space-y-2">
                      {(history[selectedClass.id] ?? []).length === 0 ? <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Belum ada presensi tersimpan.</div> : (history[selectedClass.id] ?? []).map((record) => (
                        <button key={record.meeting} type="button" onClick={() => requestMeetingChange(record.meeting)} className={cn("w-full rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary/40", meeting === record.meeting && "border-primary ring-2 ring-primary/10")}>
                          <div className="flex items-center justify-between gap-2"><span className="font-medium">Pertemuan {record.meeting}</span><CheckCircle2 className="size-4 text-emerald-600" /></div><span className="mt-1 block text-xs text-muted-foreground">{record.date}</span>
                        </button>
                      ))}
                    </div>
                  </aside>
                </div>
              )}
              <div className="flex flex-col-reverse gap-2 border-t bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className={cn("text-xs", isDirty ? "text-amber-600" : "text-muted-foreground")}>{isDirty ? "Ada perubahan yang belum disimpan." : "Semua perubahan telah tersimpan."}</p>
                <div className="flex flex-col-reverse gap-2 sm:flex-row"><Button variant="outline" onClick={requestClose}>Tutup</Button><Button onClick={requestSave} disabled={isLoading}><Save /> Simpan Presensi</Button></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Simpan presensi?</DialogTitle><DialogDescription>Data pertemuan {meeting} akan disimpan pada state dummy dan dapat dikoreksi kembali selama sesi ini.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setSaveConfirmOpen(false)}>Batal</Button><Button onClick={saveAttendance}><Save /> Ya, Simpan</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Buang perubahan?</DialogTitle><DialogDescription>Perubahan status kehadiran yang belum disimpan akan hilang.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => { setDiscardConfirmOpen(false); setPendingNavigation(null) }}>Lanjut Mengedit</Button><Button variant="destructive" onClick={confirmDiscard}>Buang Perubahan</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AttendanceSelect({ value, onChange }: { value: AttendanceValue; onChange: (value: AttendanceStatus) => void }) {
  return (
    <Select value={value ?? "UNSET"} onValueChange={(nextValue) => { if (nextValue && nextValue !== "UNSET") onChange(nextValue as AttendanceStatus) }}>
      <SelectTrigger className={cn("h-9 w-full", value && statusBadge(value))}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="UNSET">Pilih status</SelectItem>{attendanceStatuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
    </Select>
  )
}
