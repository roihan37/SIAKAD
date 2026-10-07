import { useMemo, useState } from "react"
import {
  AlertCircle,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  Filter,
  GraduationCap,
  MapPin,
  PencilLine,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  availableCourses,
  krsProfile,
  type Course,
  type KrsStatus,
} from "./krs-data"

type CourseFilter = "all" | "available" | "issue"

const statusStyles: Record<KrsStatus, string> = {
  "Belum Diajukan": "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
  "Menunggu Persetujuan": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Disetujui: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Ditolak: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
}

const filterOptions = [
  { value: "all", label: "Semua mata kuliah" },
  { value: "available", label: "Dapat dipilih" },
  { value: "issue", label: "Perlu perhatian" },
]

function CourseMeta({ course }: { course: Course }) {
  return (
    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
      <span className="flex items-start gap-2">
        <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{course.schedule}</span>
      </span>
      <span className="flex items-start gap-2">
        <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{course.lecturer}</span>
      </span>
      <span className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{course.room}</span>
      </span>
      <span className="flex items-start gap-2">
        <GraduationCap className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{course.seatsLeft > 0 ? `${course.seatsLeft} kursi tersisa` : "Kelas penuh"}</span>
      </span>
    </div>
  )
}

function SelectionPanel({
  courses,
  totalCredits,
  creditLimit,
  editable,
  onRemove,
  onSave,
  onSubmit,
}: {
  courses: Course[]
  totalCredits: number
  creditLimit: number
  editable: boolean
  onRemove: (course: Course) => void
  onSave: () => void
  onSubmit: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {courses.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 p-5 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <BookOpenCheck className="size-6 text-muted-foreground" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm font-medium">Belum ada mata kuliah</p>
            <p className="mt-1 max-w-52 text-xs leading-5 text-muted-foreground">Mata kuliah yang kamu pilih akan muncul di sini.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {courses.map((course) => (
              <li key={course.id} className="group flex items-start gap-3 rounded-xl border border-border/60 bg-muted/25 p-3 transition-colors hover:bg-muted/45">
                <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-background text-xs font-semibold ring-1 ring-border/70">
                  <span className="leading-none">{course.credits}</span>
                  <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">SKS</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-5">{course.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">{course.code} · Kelas {course.className}</p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-4 text-muted-foreground">
                    <Clock3 className="mt-px size-3 shrink-0" aria-hidden="true" />
                    <span>{course.schedule}</span>
                  </p>
                </div>
                {editable && (
                  <Button type="button" variant="ghost" size="icon-sm" className="-mt-1 -mr-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Hapus ${course.name}`} onClick={() => onRemove(course)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t bg-muted/20 p-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Beban studi dipilih</p>
            <p className="mt-1 text-sm font-medium">{courses.length} mata kuliah</p>
          </div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{totalCredits}<span className="ml-1 text-sm font-medium text-muted-foreground">/ {creditLimit} SKS</span></p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="SKS dipilih" aria-valuemin={0} aria-valuemax={creditLimit} aria-valuenow={totalCredits}>
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, (totalCredits / creditLimit) * 100)}%` }} />
        </div>
        <p className="mt-2 mb-4 text-right text-[11px] text-muted-foreground">Tersisa {Math.max(0, creditLimit - totalCredits)} SKS dari batas studi</p>
        {!editable && courses.length > 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>Aktifkan mode perbaikan untuk mengubah pilihan KRS.</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" disabled={!editable || courses.length === 0} onClick={onSave}><Save />Simpan Draft</Button>
          <Button type="button" disabled={!editable || courses.length === 0} onClick={onSubmit}><Send />Ajukan KRS</Button>
        </div>
      </div>
    </div>
  )
}

export default function MahasiswaKRSPage() {
  const [status, setStatus] = useState<KrsStatus>(krsProfile.status)
  const [selectedIds, setSelectedIds] = useState<string[]>(krsProfile.initialSelectedCourseIds)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<CourseFilter>("all")
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)

  const selectedCourses = useMemo(
    () => availableCourses.filter((course) => selectedIds.includes(course.id)),
    [selectedIds],
  )
  const selectedCredits = selectedCourses.reduce((total, course) => total + course.credits, 0)
  const remainingCredits = krsProfile.creditLimit - selectedCredits
  const editable = status === "Belum Diajukan"

  const courseWarning = (course: Course) => {
    if (course.restrictionMessage) return course.restrictionMessage
    const conflict = selectedCourses.find(
      (selected) => selected.id !== course.id && selected.scheduleKey === course.scheduleKey,
    )
    if (conflict) return `Bentrok jadwal dengan ${conflict.code} ${conflict.name}.`
    return null
  }

  const visibleCourses = availableCourses.filter((course) => {
    const keyword = search.trim().toLocaleLowerCase("id-ID")
    const matchesSearch = !keyword || [course.code, course.name, course.lecturer, course.className]
      .some((value) => value.toLocaleLowerCase("id-ID").includes(keyword))
    const warning = courseWarning(course)
    const matchesFilter = filter === "all" || (filter === "available" ? !warning : Boolean(warning))
    return matchesSearch && matchesFilter
  })

  const addCourse = (course: Course) => {
    setSelectionWarning(null)
    if (!editable) {
      setSelectionWarning("Klik Perbaiki KRS terlebih dahulu untuk mengubah pilihan mata kuliah.")
      return
    }
    const warning = courseWarning(course)
    if (warning) {
      setSelectionWarning(warning)
      return
    }
    if (selectedCredits + course.credits > krsProfile.creditLimit) {
      setSelectionWarning(`Mata kuliah ini membuat total menjadi ${selectedCredits + course.credits} SKS, melebihi batas ${krsProfile.creditLimit} SKS.`)
      return
    }
    setSelectedIds((current) => [...current, course.id])
    toast.success(`${course.code} ditambahkan ke KRS`)
  }

  const removeCourse = (course: Course) => {
    setSelectedIds((current) => current.filter((id) => id !== course.id))
    setSelectionWarning(null)
    toast.success(`${course.code} dihapus dari KRS`)
  }

  const saveDraft = () => toast.success("Draft KRS tersimpan", { description: "Data masih berupa dummy lokal dan belum dikirim ke server." })

  const submitKrs = () => {
    setStatus("Menunggu Persetujuan")
    setConfirmationOpen(false)
    setSheetOpen(false)
    setSelectionWarning(null)
    toast.success("KRS berhasil diajukan", { description: "Status berubah menjadi Menunggu Persetujuan." })
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Rencana studi semester ini</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Kartu Rencana Studi</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pilih mata kuliah sesuai batas SKS, cek validasi, lalu ajukan kepada dosen pembimbing akademik.</p>
            </div>
            <Badge variant="outline" className={cn("h-7 px-3", statusStyles[status])}>{status}</Badge>
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <div className="flex items-center gap-2"><CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Tahun Akademik</span><strong className="ml-2 font-medium">{krsProfile.academicYear}</strong></span></div>
          <div className="flex items-center gap-2"><Clock3 className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Periode KRS</span><strong className="ml-2 font-medium">{krsProfile.period}</strong></span></div>
        </div>
      </header>

      {status === "Ditolak" && (
        <Alert className="block overflow-hidden border-red-200 bg-red-50/70 p-0 text-red-950 shadow-sm dark:border-red-900 dark:bg-red-950/35 dark:text-red-100">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 ring-4 ring-red-100/60 dark:bg-red-900/60 dark:text-red-200 dark:ring-red-900/30">
              <CircleAlert className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <AlertTitle className="text-base font-semibold">KRS perlu diperbaiki</AlertTitle>
              <AlertDescription className="mt-1 text-sm leading-6 text-red-800/90 dark:text-red-200/90">
                Dosen pembimbing mengembalikan KRS kamu. Periksa catatan berikut sebelum mengajukan ulang.
              </AlertDescription>
              <div className="mt-3 rounded-lg border border-red-200/80 bg-background/70 px-3.5 py-3 dark:border-red-900 dark:bg-background/30">
                <p className="text-[11px] font-semibold tracking-wide text-red-700 uppercase dark:text-red-300">Catatan dosen pembimbing</p>
                <p className="mt-1 text-sm leading-6 text-foreground">{krsProfile.rejectionReason}</p>
              </div>
            </div>
            <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={() => { setStatus("Belum Diajukan"); toast.info("Mode perbaikan KRS aktif") }}><PencilLine />Perbaiki KRS</Button>
          </div>
        </Alert>
      )}

      <section aria-labelledby="credit-summary-title">
        <h2 id="credit-summary-title" className="sr-only">Ringkasan SKS</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "Batas SKS", value: krsProfile.creditLimit, icon: GraduationCap, tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
            { label: "SKS Dipilih", value: selectedCredits, icon: BookOpenCheck, tone: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
            { label: "Sisa SKS", value: remainingCredits, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <Card key={label} size="sm">
              <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-[11px] text-muted-foreground sm:text-sm">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{value}<span className="ml-1 text-xs font-medium text-muted-foreground">SKS</span></p></div>
                <span className={cn("hidden size-9 items-center justify-center rounded-xl sm:flex", tone)}><Icon className="size-[18px]" aria-hidden="true" /></span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {selectionWarning && (
        <Alert variant="destructive" className="bg-destructive/5">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Pilihan belum dapat ditambahkan</AlertTitle>
          <AlertDescription>{selectionWarning}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-labelledby="course-list-title" className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div><h2 id="course-list-title" className="text-lg font-semibold">Mata Kuliah Tersedia</h2><p className="mt-1 text-sm text-muted-foreground">{visibleCourses.length} mata kuliah ditemukan</p></div>
          </div>

          <Card size="sm">
            <CardContent className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
              <label className="relative block">
                <span className="sr-only">Cari mata kuliah</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input className="h-10 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kode, mata kuliah, atau dosen..." />
              </label>
              <Select items={filterOptions} value={filter} onValueChange={(value) => value && setFilter(value as CourseFilter)}>
                <SelectTrigger className="h-10 w-full"><Filter className="text-muted-foreground" /><SelectValue /></SelectTrigger>
                <SelectContent align="end">{filterOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {visibleCourses.map((course) => {
              const selected = selectedIds.includes(course.id)
              const warning = courseWarning(course)
              return (
                <Card key={course.id} className={cn("transition-colors", selected && "border-primary/30 bg-primary/[0.025] ring-primary/20")}>
                  <CardHeader className="gap-3 border-b border-border/60 pb-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold">{course.code.slice(0, 2)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{course.code}</Badge><Badge variant="outline">{course.credits} SKS</Badge><Badge variant="outline">Kelas {course.className}</Badge></div>
                        <CardTitle className="mt-2 text-base sm:text-lg">{course.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CourseMeta course={course} />
                    {warning && !selected && (
                      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"><CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" /><span>{warning}</span></div>
                    )}
                    <div className="flex justify-end">
                      {selected ? (
                        <Button type="button" variant="outline" disabled={!editable} onClick={() => removeCourse(course)}><Trash2 />Hapus dari KRS</Button>
                      ) : (
                        <Button type="button" variant={warning ? "outline" : "default"} disabled={!editable} onClick={() => addCourse(course)}><Plus />Pilih Mata Kuliah</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {visibleCourses.length === 0 && (
              <div className="rounded-xl border border-dashed py-12 text-center"><Search className="mx-auto size-8 text-muted-foreground/60" aria-hidden="true" /><p className="mt-3 text-sm font-medium">Mata kuliah tidak ditemukan</p><p className="mt-1 text-xs text-muted-foreground">Coba kata kunci atau filter lain.</p></div>
            )}
          </div>
        </section>

        <aside className="sticky top-21 hidden max-h-[calc(100dvh-6.5rem)] overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10 lg:flex lg:flex-col" aria-labelledby="my-krs-title">
          <div className="flex items-center gap-3 border-b bg-muted/20 px-4 py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileCheck2 className="size-[18px]" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1"><h2 id="my-krs-title" className="font-semibold">KRS Saya</h2><p className="mt-0.5 text-xs text-muted-foreground">Pilihan semester ini</p></div>
            <Badge variant="secondary" className="tabular-nums">{selectedCourses.length} MK</Badge>
          </div>
          <SelectionPanel courses={selectedCourses} totalCredits={selectedCredits} creditLimit={krsProfile.creditLimit} editable={editable} onRemove={removeCourse} onSave={saveDraft} onSubmit={() => setConfirmationOpen(true)} />
        </aside>
      </div>

      <button type="button" onClick={() => setSheetOpen(true)} className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 text-left shadow-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inset-x-5 lg:hidden" aria-label={`Buka KRS Saya, ${selectedCredits} dari ${krsProfile.creditLimit} SKS dipilih`}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileCheck2 className="size-[18px]" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">KRS Saya</span><span className="block text-xs text-muted-foreground">{selectedCourses.length} mata kuliah · {selectedCredits}/{krsProfile.creditLimit} SKS</span></span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[88dvh] gap-0 rounded-t-3xl border-border/70 bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
          <SheetHeader className="relative shrink-0 border-b px-4 pt-4 pb-4 pr-16">
            <SheetTitle className="text-lg font-semibold">KRS Saya</SheetTitle>
            <SheetDescription>{selectedCourses.length} mata kuliah dipilih untuk {krsProfile.academicYear}.</SheetDescription>
            <SheetClose aria-label="Tutup KRS Saya" className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-5" aria-hidden="true" /></SheetClose>
          </SheetHeader>
          <SelectionPanel courses={selectedCourses} totalCredits={selectedCredits} creditLimit={krsProfile.creditLimit} editable={editable} onRemove={removeCourse} onSave={saveDraft} onSubmit={() => setConfirmationOpen(true)} />
        </SheetContent>
      </Sheet>

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajukan KRS sekarang?</DialogTitle>
            <DialogDescription>Pastikan pilihan mata kuliah sudah benar. Setelah diajukan, KRS akan dikunci selama menunggu persetujuan dosen PA.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Mata kuliah</span><strong>{selectedCourses.length}</strong></div>
            <div className="mt-2 flex items-center justify-between text-sm"><span className="text-muted-foreground">Total SKS</span><strong>{selectedCredits} SKS</strong></div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>Periksa Lagi</DialogClose>
            <Button type="button" onClick={submitKrs}><Send />Ya, Ajukan KRS</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
