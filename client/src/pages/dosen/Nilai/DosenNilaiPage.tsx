import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Database,
  FileCheck2,
  LoaderCircle,
  Save,
  Search,
  Send,
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

type GradeField = "assignment" | "midterm" | "finalExam"
type GradeStatus = "INCOMPLETE" | "DRAFT" | "PUBLISHED"
type GradeFilter = "ALL" | GradeStatus

type StudentGrade = {
  nim: string
  name: string
  assignment: number | null
  midterm: number | null
  finalExam: number | null
}

type LecturerClass = {
  id: number
  courseCode: string
  courseName: string
  credits: number
  className: string
  lecturer: string
  schedule: string
  totalStudents: number
  published: boolean
}

const activeAcademicYear = "2026/2027 Ganjil"
const weights: Record<GradeField, number> = { assignment: 30, midterm: 30, finalExam: 40 }
const gradeScale = [
  { minimum: 85, label: "A" },
  { minimum: 80, label: "B+" },
  { minimum: 75, label: "B" },
  { minimum: 70, label: "C+" },
  { minimum: 65, label: "C" },
  { minimum: 50, label: "D" },
  { minimum: 0, label: "E" },
]

const initialClasses: LecturerClass[] = [
  { id: 1, courseCode: "IF201", courseName: "Algoritma dan Pemrograman", credits: 3, className: "TI-2A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Senin, 08.00–09.40", totalStudents: 32, published: false },
  { id: 2, courseCode: "IF203", courseName: "Struktur Data", credits: 3, className: "TI-2B", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Senin, 10.00–11.40", totalStudents: 30, published: false },
  { id: 3, courseCode: "IF402", courseName: "Manajemen Proyek TI", credits: 2, className: "TI-4A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Selasa, 09.50–11.30", totalStudents: 26, published: true },
  { id: 4, courseCode: "IF305", courseName: "Rekayasa Perangkat Lunak", credits: 3, className: "TI-3A", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Rabu, 13.00–14.40", totalStudents: 28, published: false },
  { id: 5, courseCode: "IF207", courseName: "Basis Data", credits: 3, className: "TI-2C", lecturer: "Dr. Budi Santoso, S.Kom., M.Kom.", schedule: "Kamis, 08.00–09.40", totalStudents: 31, published: true },
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

function createStudents(item: LecturerClass): StudentGrade[] {
  return Array.from({ length: item.totalStudents }, (_, index) => {
    const complete = item.published || item.id === 4 || index < Math.floor(item.totalStudents * (item.id === 1 ? 0.72 : 0.45))
    return {
      nim: `${23 + (item.id % 2)}101${String(item.id).padStart(2, "0")}${String(index + 1).padStart(2, "0")}`,
      name: studentNames[index % studentNames.length],
      assignment: complete ? 72 + ((index * 7 + item.id) % 25) : index % 3 === 0 ? 75 + (index % 20) : null,
      midterm: complete ? 68 + ((index * 5 + item.id) % 29) : index % 4 === 0 ? 70 + (index % 22) : null,
      finalExam: complete ? 70 + ((index * 3 + item.id) % 27) : null,
    }
  })
}

function createInitialGrades(): Record<number, StudentGrade[]> {
  return Object.fromEntries(initialClasses.map((item) => [item.id, createStudents(item)]))
}

function isValidScore(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

function isComplete(student: StudentGrade) {
  return isValidScore(student.assignment) && isValidScore(student.midterm) && isValidScore(student.finalExam)
}

function finalScore(student: StudentGrade) {
  const { assignment, midterm, finalExam } = student
  if (!isValidScore(assignment) || !isValidScore(midterm) || !isValidScore(finalExam)) return null
  return (assignment * weights.assignment + midterm * weights.midterm + finalExam * weights.finalExam) / 100
}

function letterGrade(score: number | null) {
  if (score === null) return "—"
  return gradeScale.find((item) => score >= item.minimum)?.label ?? "—"
}

function classStatus(item: LecturerClass, grades: StudentGrade[]): GradeStatus {
  if (item.published) return "PUBLISHED"
  return grades.every(isComplete) ? "DRAFT" : "INCOMPLETE"
}

function statusLabel(status: GradeStatus) {
  return status === "PUBLISHED" ? "Dipublikasikan" : status === "DRAFT" ? "Draft" : "Belum Lengkap"
}

function statusStyle(status: GradeStatus) {
  if (status === "PUBLISHED") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
  if (status === "DRAFT") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
}

export default function DosenNilaiPage() {
  const [classes, setClasses] = useState(initialClasses)
  const [grades, setGrades] = useState<Record<number, StudentGrade[]>>(createInitialGrades)
  const [courseFilter, setCourseFilter] = useState("ALL")
  const [classFilter, setClassFilter] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState<GradeFilter>("ALL")
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null)
  const [workingGrades, setWorkingGrades] = useState<StudentGrade[]>([])
  const [baseline, setBaseline] = useState("")
  const [search, setSearch] = useState("")
  const [manageOpen, setManageOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false)
  const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)
  const [validationMessage, setValidationMessage] = useState("")

  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? null
  const currentSnapshot = JSON.stringify(workingGrades)
  const isDirty = manageOpen && !isLoading && baseline !== "" && currentSnapshot !== baseline
  const isPublished = selectedClass?.published ?? false

  useEffect(() => {
    if (!isDirty) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [isDirty])

  const classRows = useMemo(() => classes.map((item) => {
    const classGrades = grades[item.id] ?? []
    const completed = classGrades.filter(isComplete).length
    return {
      item,
      completed,
      progress: item.totalStudents === 0 ? 0 : Math.round((completed / item.totalStudents) * 100),
      status: classStatus(item, classGrades),
    }
  }), [classes, grades])

  const filteredClasses = classRows.filter(({ item, status }) => (
    (courseFilter === "ALL" || item.courseCode === courseFilter)
    && (classFilter === "ALL" || item.className === classFilter)
    && (statusFilter === "ALL" || status === statusFilter)
  ))

  const publishedCount = classRows.filter(({ status }) => status === "PUBLISHED").length
  const completeCount = classRows.filter(({ status }) => status === "PUBLISHED" || status === "DRAFT").length
  const incompleteCount = classRows.length - completeCount
  const visibleStudents = workingGrades.filter((student) => {
    const query = search.trim().toLowerCase()
    return !query || student.name.toLowerCase().includes(query) || student.nim.toLowerCase().includes(query)
  })
  const completeStudents = workingGrades.filter(isComplete).length
  const invalidScores = workingGrades.reduce((count, student) => count + ([student.assignment, student.midterm, student.finalExam].filter((value) => value !== null && !isValidScore(value)).length), 0)

  const loadClass = (item: LecturerClass) => {
    const nextGrades = (grades[item.id] ?? []).map((student) => ({ ...student }))
    setSelectedClassId(item.id)
    setWorkingGrades(nextGrades)
    setBaseline(JSON.stringify(nextGrades))
    setSearch("")
    setValidationMessage("")
  }

  const openManage = (item: LecturerClass) => {
    setManageOpen(true)
    setIsLoading(true)
    window.setTimeout(() => {
      loadClass(item)
      setIsLoading(false)
    }, 300)
  }

  const requestClose = () => {
    if (isDirty) {
      setDiscardConfirmOpen(true)
      return
    }
    setManageOpen(false)
  }

  const updateScore = (nim: string, field: GradeField, rawValue: string) => {
    const value = rawValue === "" ? null : Number(rawValue)
    setWorkingGrades((current) => current.map((student) => student.nim === nim ? { ...student, [field]: value } : student))
    setValidationMessage("")
  }

  const saveDraft = () => {
    if (!selectedClass || invalidScores > 0 || isPublished) {
      if (invalidScores > 0) setValidationMessage(`${invalidScores} nilai berada di luar rentang 0–100.`)
      return
    }
    const saved = workingGrades.map((student) => ({ ...student }))
    setGrades((current) => ({ ...current, [selectedClass.id]: saved }))
    setBaseline(JSON.stringify(saved))
    toast.success("Draft nilai tersimpan", { description: `${selectedClass.courseName} · Kelas ${selectedClass.className}` })
  }

  const requestPublish = () => {
    if (isPublished) return
    if (invalidScores > 0) {
      setValidationMessage(`${invalidScores} nilai berada di luar rentang 0–100.`)
      return
    }
    const incomplete = workingGrades.length - completeStudents
    if (incomplete > 0) {
      setValidationMessage(`${incomplete} mahasiswa belum memiliki nilai Tugas, UTS, dan UAS yang lengkap.`)
      return
    }
    setValidationMessage("")
    setPublishConfirmOpen(true)
  }

  const publishGrades = () => {
    if (!selectedClass) return
    const saved = workingGrades.map((student) => ({ ...student }))
    setGrades((current) => ({ ...current, [selectedClass.id]: saved }))
    setClasses((current) => current.map((item) => item.id === selectedClass.id ? { ...item, published: true } : item))
    setBaseline(JSON.stringify(saved))
    setPublishConfirmOpen(false)
    toast.success("Nilai berhasil dipublikasikan", { description: "Nilai kini hanya dapat dilihat dalam simulasi ini." })
  }

  const confirmDiscard = () => {
    setManageOpen(false)
    setDiscardConfirmOpen(false)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge className="gap-1.5" variant="outline"><Database className="size-3.5" /> Data Dummy</Badge>
            <Badge variant="secondary">Tahun Akademik {activeAcademicYear}</Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Nilai</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kelola nilai kelas yang Anda ampu sebelum dipublikasikan kepada mahasiswa.</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[
          { label: "Total Kelas", value: classes.length, icon: BookOpenCheck, tone: "text-primary" },
          { label: "Nilai Lengkap", value: completeCount, icon: CheckCircle2, tone: "text-emerald-600" },
          { label: "Belum Lengkap", value: incompleteCount, icon: CircleAlert, tone: "text-amber-600" },
        ].map(({ label, value, icon: Icon, tone }, index) => (
          <Card className={cn(index === 2 && "col-span-2 lg:col-span-1")} key={label}>
            <CardContent className="flex items-center justify-between p-4 sm:p-5">
              <div><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>
              <div className="rounded-xl bg-muted p-2.5"><Icon className={cn("size-5", tone)} /></div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Filter Kelas</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Select value={courseFilter} onValueChange={(value) => setCourseFilter(value ?? "ALL")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Mata kuliah" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Semua Mata Kuliah</SelectItem>{classes.map((item) => <SelectItem key={item.id} value={item.courseCode}>{item.courseCode} · {item.courseName}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={classFilter} onValueChange={(value) => setClassFilter(value ?? "ALL")}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Kelas" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Semua Kelas</SelectItem>{classes.map((item) => <SelectItem key={item.id} value={item.className}>{item.className}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as GradeFilter)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Status nilai" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">Semua Status</SelectItem><SelectItem value="INCOMPLETE">Belum Lengkap</SelectItem><SelectItem value="DRAFT">Draft</SelectItem><SelectItem value="PUBLISHED">Dipublikasikan</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Kelas yang Diampu</h2><p className="text-sm text-muted-foreground">{filteredClasses.length} kelas ditampilkan · {publishedCount} telah dipublikasikan</p></div></div>
        {filteredClasses.length === 0 ? (
          <Card><CardContent className="flex min-h-52 flex-col items-center justify-center text-center"><FileCheck2 className="mb-3 size-10 text-muted-foreground" /><h3 className="font-semibold">Tidak ada kelas ditemukan</h3><p className="mt-1 text-sm text-muted-foreground">Ubah filter untuk melihat kelas lainnya.</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredClasses.map(({ item, completed, progress, status }) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><div className="mb-2 flex flex-wrap gap-2"><Badge variant="secondary">{item.courseCode}</Badge><Badge variant="outline">{item.credits} SKS</Badge><Badge className={statusStyle(status)} variant="outline">{statusLabel(status)}</Badge></div><h3 className="font-semibold leading-snug">{item.courseName}</h3><p className="mt-1 text-sm text-muted-foreground">Kelas {item.className} · {item.schedule}</p></div>
                    <div className="rounded-xl bg-muted p-2.5"><UsersRound className="size-5 text-muted-foreground" /></div>
                  </div>
                  <div className="mt-5 space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Kelengkapan nilai</span><span className="font-medium">{completed}/{item.totalStudents} mahasiswa</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", status === "PUBLISHED" ? "bg-emerald-500" : "bg-primary")} style={{ width: `${progress}%` }} /></div><p className="text-right text-xs text-muted-foreground">{progress}% lengkap</p></div>
                  <Button className="mt-4 w-full sm:w-auto" onClick={() => openManage(item)}>{status === "PUBLISHED" ? "Lihat Nilai" : "Kelola Nilai"} <ChevronRight /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Dialog open={manageOpen} onOpenChange={(open) => { if (!open) requestClose() }}>
        <DialogContent className="flex max-h-[92vh] max-w-[96vw] flex-col overflow-hidden p-0 sm:max-w-6xl">
          {isLoading || !selectedClass ? (
            <div className="flex min-h-80 items-center justify-center"><LoaderCircle className="size-7 animate-spin text-primary" /><span className="ml-2 text-sm text-muted-foreground">Memuat data nilai...</span></div>
          ) : (
            <>
              <DialogHeader className="border-b px-5 py-4 pr-12 text-left sm:px-6">
                <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{selectedClass.courseCode}</Badge><Badge variant="outline">Kelas {selectedClass.className}</Badge><Badge variant="outline">{selectedClass.credits} SKS</Badge><Badge variant="outline">Data Dummy</Badge></div>
                <DialogTitle className="text-lg sm:text-xl">{isPublished ? "Lihat Nilai" : "Kelola Nilai"} · {selectedClass.courseName}</DialogTitle>
                <DialogDescription>{selectedClass.lecturer} · {selectedClass.schedule}</DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><p className="font-medium">Bobot penilaian simulasi</p><p className="text-xs text-muted-foreground">Dapat dikonfigurasi di konstanta halaman dan bukan aturan penilaian kampus.</p></div><div className="flex flex-wrap gap-2"><Badge variant="outline">Tugas {weights.assignment}%</Badge><Badge variant="outline">UTS {weights.midterm}%</Badge><Badge variant="outline">UAS {weights.finalExam}%</Badge></div></div>
                  <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Skala grade simulasi: A ≥ 85 · B+ ≥ 80 · B ≥ 75 · C+ ≥ 70 · C ≥ 65 · D ≥ 50 · E &lt; 50.</p>
                </div>

                {isPublished && <div className="flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>Nilai telah dipublikasikan dan menjadi read-only dalam simulasi ini.</span></div>}
                {validationMessage && <div className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><span>{validationMessage}</span></div>}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari NIM atau nama mahasiswa" /></div>
                  <div className="flex flex-wrap gap-2 text-sm"><Badge variant="secondary">{completeStudents}/{workingGrades.length} lengkap</Badge>{isDirty && <Badge className="border-amber-300 text-amber-700 dark:text-amber-300" variant="outline"><CircleAlert className="mr-1 size-3" /> Belum disimpan</Badge>}</div>
                </div>

                {visibleStudents.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed text-center"><Search className="mb-2 size-8 text-muted-foreground" /><p className="font-medium">Mahasiswa tidak ditemukan</p><p className="text-sm text-muted-foreground">Coba gunakan kata kunci lain.</p></div>
                ) : (
                  <>
                    <div className="hidden overflow-hidden rounded-xl border md:block">
                      <Table>
                        <TableHeader><TableRow><TableHead className="w-14">No.</TableHead><TableHead>Mahasiswa</TableHead><TableHead className="w-28">Tugas</TableHead><TableHead className="w-28">UTS</TableHead><TableHead className="w-28">UAS</TableHead><TableHead className="w-24 text-center">Akhir</TableHead><TableHead className="w-20 text-center">Grade</TableHead><TableHead className="w-28">Status</TableHead></TableRow></TableHeader>
                        <TableBody>{visibleStudents.map((student, index) => <GradeRow key={student.nim} student={student} index={index} disabled={isPublished} onChange={updateScore} />)}</TableBody>
                      </Table>
                    </div>
                    <div className="space-y-3 md:hidden">{visibleStudents.map((student) => <GradeCard key={student.nim} student={student} disabled={isPublished} onChange={updateScore} />)}</div>
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 border-t bg-background px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <Button variant="outline" onClick={requestClose}>Tutup</Button>
                {!isPublished && <><Button variant="secondary" onClick={saveDraft} disabled={!isDirty}><Save /> Simpan Draft</Button><Button onClick={requestPublish}><Send /> Publikasikan Nilai</Button></>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={publishConfirmOpen} onOpenChange={setPublishConfirmOpen}>
        <DialogContent><DialogHeader><DialogTitle>Publikasikan nilai?</DialogTitle><DialogDescription>Semua nilai akan dikunci menjadi read-only dalam simulasi ini. Pastikan data sudah diperiksa.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setPublishConfirmOpen(false)}>Batal</Button><Button onClick={publishGrades}><Send /> Ya, Publikasikan</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={discardConfirmOpen} onOpenChange={setDiscardConfirmOpen}>
        <DialogContent><DialogHeader><DialogTitle>Buang perubahan?</DialogTitle><DialogDescription>Perubahan nilai yang belum disimpan akan hilang.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDiscardConfirmOpen(false)}>Kembali Mengedit</Button><Button variant="destructive" onClick={confirmDiscard}>Buang Perubahan</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  )
}

type GradeEditorProps = {
  student: StudentGrade
  disabled: boolean
  onChange: (nim: string, field: GradeField, value: string) => void
}

function ScoreInput({ student, field, disabled, onChange }: GradeEditorProps & { field: GradeField }) {
  const value = student[field]
  const invalid = value !== null && !isValidScore(value)
  return <Input aria-invalid={invalid} className={cn("h-9 w-full", invalid && "border-destructive focus-visible:ring-destructive")} disabled={disabled} inputMode="decimal" max={100} min={0} onChange={(event) => onChange(student.nim, field, event.target.value)} type="number" value={value ?? ""} />
}

function GradeRow({ student, index, disabled, onChange }: GradeEditorProps & { index: number }) {
  const score = finalScore(student)
  const complete = isComplete(student)
  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
      <TableCell><p className="font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.nim}</p></TableCell>
      <TableCell><ScoreInput student={student} field="assignment" disabled={disabled} onChange={onChange} /></TableCell>
      <TableCell><ScoreInput student={student} field="midterm" disabled={disabled} onChange={onChange} /></TableCell>
      <TableCell><ScoreInput student={student} field="finalExam" disabled={disabled} onChange={onChange} /></TableCell>
      <TableCell className="text-center font-semibold">{score?.toFixed(1) ?? "—"}</TableCell>
      <TableCell className="text-center"><Badge variant={complete ? "secondary" : "outline"}>{letterGrade(score)}</Badge></TableCell>
      <TableCell><Badge className={complete ? "border-emerald-200 text-emerald-700 dark:text-emerald-300" : "border-amber-200 text-amber-700 dark:text-amber-300"} variant="outline">{complete ? "Lengkap" : "Belum Lengkap"}</Badge></TableCell>
    </TableRow>
  )
}

function GradeCard({ student, disabled, onChange }: GradeEditorProps) {
  const score = finalScore(student)
  const complete = isComplete(student)
  return (
    <Card><CardContent className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3"><div><p className="font-medium leading-tight">{student.name}</p><p className="mt-1 text-xs text-muted-foreground">{student.nim}</p></div><Badge className={complete ? "border-emerald-200 text-emerald-700 dark:text-emerald-300" : "border-amber-200 text-amber-700 dark:text-amber-300"} variant="outline">{complete ? "Lengkap" : "Belum Lengkap"}</Badge></div>
      <div className="grid grid-cols-3 gap-2">{(["assignment", "midterm", "finalExam"] as GradeField[]).map((field) => <label className="space-y-1.5" key={field}><span className="text-xs text-muted-foreground">{field === "assignment" ? "Tugas" : field === "midterm" ? "UTS" : "UAS"}</span><ScoreInput student={student} field={field} disabled={disabled} onChange={onChange} /></label>)}</div>
      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm"><span className="text-muted-foreground">Nilai Akhir</span><span className="font-semibold">{score?.toFixed(1) ?? "—"} <Badge className="ml-1" variant="secondary">{letterGrade(score)}</Badge></span></div>
    </CardContent></Card>
  )
}
