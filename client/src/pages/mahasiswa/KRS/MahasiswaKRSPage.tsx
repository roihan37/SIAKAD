import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BookOpenCheck,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  Filter,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  UserRound,
  X,
} from "lucide-react"
import { toast } from "sonner"
import {
  getStudentKrs,
  saveStudentKrsDraft,
  studentKrsErrorMessage,
  submitStudentKrs,
} from "@/api/student-krs"
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
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  StudentKrsData,
  StudentKrsOffering,
  StudentKrsSchedule,
  StudentKrsStatus,
} from "@/types/student-krs"

type CourseFilter = "all" | "available" | "issue"
type MutationState = "saving" | "submitting" | null

const statusLabels: Record<Exclude<StudentKrsStatus, null> | "NONE", string> = {
  NONE: "Belum Diajukan",
  DRAFT: "Draft",
  DIAJUKAN: "Menunggu Persetujuan",
  DISETUJUI: "Disetujui",
  DITOLAK: "Ditolak",
}

const statusStyles: Record<Exclude<StudentKrsStatus, null> | "NONE", string> = {
  NONE: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300",
  DRAFT: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  DIAJUKAN: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  DISETUJUI: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  DITOLAK: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
}

const filterOptions = [
  { value: "all", label: "Semua mata kuliah" },
  { value: "available", label: "Dapat dipilih" },
  { value: "issue", label: "Perlu perhatian" },
]

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

function formatDay(day: string) {
  return `${day.charAt(0).toUpperCase()}${day.slice(1).toLowerCase()}`
}

function formatSchedule(schedule: StudentKrsSchedule) {
  return `${formatDay(schedule.hari)}, ${schedule.jamMulai}–${schedule.jamSelesai}`
}

function formatSchedules(course: StudentKrsOffering) {
  return course.schedules.length > 0
    ? course.schedules.map(formatSchedule).join("; ")
    : "Jadwal belum tersedia"
}

function formatRooms(course: StudentKrsOffering) {
  if (course.schedules.length === 0) return "Ruangan belum tersedia"
  return [...new Set(course.schedules.map(({ room }) => `${room.kode} · ${room.nama}`))].join("; ")
}

function schedulesOverlap(first: StudentKrsSchedule, second: StudentKrsSchedule) {
  return first.hari === second.hari
    && first.jamMulai < second.jamSelesai
    && second.jamMulai < first.jamSelesai
}

function haveSameIds(first: number[], second: number[]) {
  if (first.length !== second.length) return false
  const secondIds = new Set(second)
  return first.every((id) => secondIds.has(id))
}

function CourseMeta({ course }: { course: StudentKrsOffering }) {
  return (
    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
      <span className="flex items-start gap-2">
        <Clock3 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{formatSchedules(course)}</span>
      </span>
      <span className="flex items-start gap-2">
        <UserRound className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{course.lecturer.name}</span>
      </span>
      <span className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>{formatRooms(course)}</span>
      </span>
    </div>
  )
}

function SelectionPanel({
  courses,
  totalCredits,
  editable,
  canSave,
  canSubmit,
  dirty,
  mutation,
  onRemove,
  onSave,
  onSubmit,
}: {
  courses: StudentKrsOffering[]
  totalCredits: number
  editable: boolean
  canSave: boolean
  canSubmit: boolean
  dirty: boolean
  mutation: MutationState
  onRemove: (course: StudentKrsOffering) => void
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
              <li key={course.kelasMataKuliahId} className="group flex items-start gap-3 rounded-xl border border-border/60 bg-muted/25 p-3 transition-colors hover:bg-muted/45">
                <span className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-background text-xs font-semibold ring-1 ring-border/70">
                  <span className="leading-none">{course.course.sks}</span>
                  <span className="mt-0.5 text-[9px] font-medium text-muted-foreground">SKS</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-5">{course.course.nama}</p>
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">{course.course.kode} · Kelas {course.class.nama}</p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-4 text-muted-foreground">
                    <Clock3 className="mt-px size-3 shrink-0" aria-hidden="true" />
                    <span>{formatSchedules(course)}</span>
                  </p>
                </div>
                {editable && (
                  <Button type="button" variant="ghost" size="icon-sm" className="-mt-1 -mr-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Hapus ${course.course.nama}`} disabled={mutation !== null} onClick={() => onRemove(course)}>
                    <Trash2 className="text-destructive" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="shrink-0 border-t bg-muted/20 p-4">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Beban studi dipilih</p>
            <p className="mt-1 text-sm font-medium">{courses.length} mata kuliah</p>
          </div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{totalCredits}<span className="ml-1 text-sm font-medium text-muted-foreground">SKS</span></p>
        </div>
        {dirty && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>Simpan perubahan sebagai draf sebelum mengajukan KRS.</span>
          </div>
        )}
        {!editable && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>KRS tidak dapat diubah pada status atau periode saat ini.</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant="outline" disabled={!canSave || mutation !== null} onClick={onSave}>
            <Save />{mutation === "saving" ? "Menyimpan..." : "Simpan Draft"}
          </Button>
          <Button type="button" disabled={!canSubmit || dirty || mutation !== null} onClick={onSubmit}>
            <Send />{mutation === "submitting" ? "Mengajukan..." : "Ajukan KRS"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 sm:space-y-6 sm:py-7" aria-busy="true">
      <Skeleton className="h-48 rounded-2xl" />
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="hidden h-96 rounded-2xl lg:block" />
      </div>
    </main>
  )
}

export default function MahasiswaKRSPage() {
  const [data, setData] = useState<StudentKrsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<CourseFilter>("all")
  const [selectionWarning, setSelectionWarning] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [mutation, setMutation] = useState<MutationState>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadKrs() {
      setLoading(true)
      setLoadError(null)
      try {
        const nextData = await getStudentKrs(controller.signal)
        setData(nextData)
        setSelectedIds(nextData.selectedKrsCourses.map(({ kelasMataKuliahId }) => kelasMataKuliahId))
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(studentKrsErrorMessage(error, "KRS belum dapat dimuat. Silakan coba lagi."))
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadKrs()
    return () => controller.abort()
  }, [loadAttempt])

  const offeringById = useMemo(() => {
    const offerings = new Map<number, StudentKrsOffering>()
    data?.availableCourses.forEach((course) => offerings.set(course.kelasMataKuliahId, course))
    data?.selectedKrsCourses.forEach((course) => offerings.set(course.kelasMataKuliahId, course))
    return offerings
  }, [data])

  const selectedCourses = selectedIds.flatMap((id) => {
    const course = offeringById.get(id)
    return course ? [course] : []
  })
  const selectedCredits = selectedCourses.reduce((total, course) => total + course.course.sks, 0)
  const savedIds = data?.selectedKrsCourses.map(({ kelasMataKuliahId }) => kelasMataKuliahId) ?? []
  const dirty = !haveSameIds(selectedIds, savedIds)
  const editable = data?.permissions.canEdit === true
  const canSave = data?.permissions.canSaveDraft === true && (dirty || data.krsStatus !== "DRAFT")
  const canSubmit = data?.permissions.canSubmit === true && selectedCourses.length > 0

  const courseWarning = (course: StudentKrsOffering) => {
    if (!data?.krsPeriod?.isOpen) return "Periode KRS sedang tidak dibuka."
    if (!data.permissions.canEdit) return "KRS tidak dapat diubah pada status saat ini."

    const duplicate = selectedCourses.find(
      (selected) => selected.kelasMataKuliahId !== course.kelasMataKuliahId
        && selected.course.id === course.course.id,
    )
    if (duplicate) return `Mata kuliah ini sudah dipilih di kelas ${duplicate.class.nama}.`

    const conflict = selectedCourses.find(
      (selected) => selected.kelasMataKuliahId !== course.kelasMataKuliahId
        && selected.schedules.some((selectedSchedule) =>
          course.schedules.some((schedule) => schedulesOverlap(selectedSchedule, schedule)),
        ),
    )
    if (conflict) return `Bentrok jadwal dengan ${conflict.course.kode} ${conflict.course.nama}.`

    if (!course.canSelect && !["COURSE_ALREADY_SELECTED", "SCHEDULE_CONFLICT"].includes(course.unavailableReason ?? "")) {
      return "Kelas mata kuliah ini belum dapat dipilih."
    }
    return null
  }

  const visibleCourses = (data?.availableCourses ?? []).filter((course) => {
    const keyword = search.trim().toLocaleLowerCase("id-ID")
    const matchesSearch = !keyword || [course.course.kode, course.course.nama, course.lecturer.name, course.class.nama]
      .some((value) => value.toLocaleLowerCase("id-ID").includes(keyword))
    const warning = courseWarning(course)
    const matchesFilter = filter === "all" || (filter === "available" ? !warning : Boolean(warning))
    return matchesSearch && matchesFilter
  })

  const applyServerData = (nextData: StudentKrsData) => {
    setData(nextData)
    setSelectedIds(nextData.selectedKrsCourses.map(({ kelasMataKuliahId }) => kelasMataKuliahId))
    setSelectionWarning(null)
    setRequestError(null)
  }

  const addCourse = (course: StudentKrsOffering) => {
    setSelectionWarning(null)
    const warning = courseWarning(course)
    if (warning) {
      setSelectionWarning(warning)
      return
    }
    setSelectedIds((current) => current.includes(course.kelasMataKuliahId)
      ? current
      : [...current, course.kelasMataKuliahId])
    toast.success(`${course.course.kode} ditambahkan ke KRS`)
  }

  const removeCourse = (course: StudentKrsOffering) => {
    setSelectedIds((current) => current.filter((id) => id !== course.kelasMataKuliahId))
    setSelectionWarning(null)
    toast.success(`${course.course.kode} dihapus dari KRS`)
  }

  const saveDraft = async () => {
    if (!canSave || mutation !== null) return
    setMutation("saving")
    setRequestError(null)
    try {
      applyServerData(await saveStudentKrsDraft(selectedIds))
      toast.success("Draft KRS tersimpan")
    } catch (error) {
      setRequestError(studentKrsErrorMessage(error, "Draft KRS belum dapat disimpan. Silakan coba lagi."))
    } finally {
      setMutation(null)
    }
  }

  const submitKrs = async () => {
    if (!canSubmit || dirty || mutation !== null) return
    setMutation("submitting")
    setRequestError(null)
    try {
      applyServerData(await submitStudentKrs())
      setConfirmationOpen(false)
      setSheetOpen(false)
      toast.success("KRS berhasil diajukan")
    } catch (error) {
      setRequestError(studentKrsErrorMessage(error, "KRS belum dapat diajukan. Silakan coba lagi."))
      setConfirmationOpen(false)
    } finally {
      setMutation(null)
    }
  }

  if (loading && !data) return <LoadingState />

  if (!data) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center py-8">
        <Card className="w-full">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="size-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 text-lg font-semibold">KRS belum dapat ditampilkan</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{loadError}</p>
            <Button type="button" className="mt-5" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
              <RefreshCw />Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const statusKey = data.krsStatus ?? "NONE"
  const academicYear = `${data.academicYear.tahun} · ${data.academicYear.semester === "GANJIL" ? "Ganjil" : "Genap"}`
  const period = data.krsPeriod
    ? `${dateFormatter.format(new Date(data.krsPeriod.mulai))}–${dateFormatter.format(new Date(data.krsPeriod.selesai))}`
    : "Belum tersedia"

  const selectionPanel = (
    <SelectionPanel
      courses={selectedCourses}
      totalCredits={selectedCredits}
      editable={editable}
      canSave={canSave}
      canSubmit={canSubmit}
      dirty={dirty}
      mutation={mutation}
      onRemove={removeCourse}
      onSave={() => void saveDraft()}
      onSubmit={() => setConfirmationOpen(true)}
    />
  )

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Rencana studi semester ini</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Kartu Rencana Studi</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pilih kelas mata kuliah, simpan sebagai draf, lalu ajukan kepada dosen pembimbing akademik.</p>
            </div>
            <Badge variant="outline" className={cn("h-7 px-3", statusStyles[statusKey])}>{statusLabels[statusKey]}</Badge>
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <div className="flex items-center gap-2"><CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Tahun Akademik</span><strong className="ml-2 font-medium">{academicYear}</strong></span></div>
          <div className="flex items-center gap-2"><Clock3 className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Periode KRS</span><strong className="ml-2 font-medium">{period}</strong></span></div>
        </div>
      </header>

      {data.krsStatus === "DITOLAK" && (
        <Alert className="border-red-200 bg-red-50/70 text-red-950 shadow-sm dark:border-red-900 dark:bg-red-950/35 dark:text-red-100">
          <CircleAlert aria-hidden="true" />
          <AlertTitle className="text-base font-semibold">KRS perlu diperbaiki</AlertTitle>
          <AlertDescription className="text-sm leading-6 text-red-800/90 dark:text-red-200/90">
            Dosen pembimbing mengembalikan KRS kamu. Ubah pilihan mata kuliah, simpan sebagai draf, lalu ajukan kembali.
          </AlertDescription>
        </Alert>
      )}

      {data.krsStatus === "DRAFT" && !dirty && (
        <Alert className="border-blue-200 bg-blue-50/70 text-blue-950 dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-100">
          <FileCheck2 aria-hidden="true" />
          <AlertTitle>Draft KRS tersimpan</AlertTitle>
          <AlertDescription className="text-blue-800/90 dark:text-blue-200/90">Pilihan ini belum dikirim ke dosen PA. Ajukan KRS ketika sudah selesai.</AlertDescription>
        </Alert>
      )}

      {!data.krsPeriod?.isOpen && (
        <Alert className="border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900 dark:bg-amber-950/35 dark:text-amber-100">
          <CalendarClock aria-hidden="true" />
          <AlertTitle>Periode KRS tidak dibuka</AlertTitle>
          <AlertDescription className="text-amber-800/90 dark:text-amber-200/90">KRS dapat dilihat, tetapi belum dapat diubah atau diajukan.</AlertDescription>
        </Alert>
      )}

      {requestError && (
        <Alert variant="destructive" className="bg-destructive/5">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Perubahan belum tersimpan</AlertTitle>
          <AlertDescription>{requestError}</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="krs-summary-title">
        <h2 id="krs-summary-title" className="sr-only">Ringkasan KRS</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card size="sm">
            <CardContent><p className="text-[11px] text-muted-foreground sm:text-sm">SKS Dipilih</p><p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{selectedCredits}<span className="ml-1 text-xs font-medium text-muted-foreground">SKS</span></p></CardContent>
          </Card>
          <Card size="sm">
            <CardContent><p className="text-[11px] text-muted-foreground sm:text-sm">Mata Kuliah</p><p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{selectedCourses.length}<span className="ml-1 text-xs font-medium text-muted-foreground">kelas</span></p></CardContent>
          </Card>
          <Card size="sm">
            <CardContent><p className="text-[11px] text-muted-foreground sm:text-sm">Periode</p><p className="mt-1 text-sm font-semibold sm:text-base">{data.krsPeriod?.isOpen ? "Dibuka" : data.krsPeriod ? "Ditutup" : "Belum ada"}</p></CardContent>
          </Card>
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
            <div><h2 id="course-list-title" className="text-lg font-semibold">Mata Kuliah Tersedia</h2><p className="mt-1 text-sm text-muted-foreground">{visibleCourses.length} kelas mata kuliah ditemukan</p></div>
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
              const selected = selectedIds.includes(course.kelasMataKuliahId)
              const warning = courseWarning(course)
              return (
                <Card key={course.kelasMataKuliahId} className={cn("transition-colors", selected && "border-primary/30 bg-primary/[0.025] ring-primary/20")}>
                  <CardHeader className="gap-3 border-b border-border/60 pb-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-xs font-bold">{course.course.kode.slice(0, 2)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{course.course.kode}</Badge><Badge variant="outline">{course.course.sks} SKS</Badge><Badge variant="outline">Kelas {course.class.nama}</Badge></div>
                        <CardTitle className="mt-2 text-base sm:text-lg">{course.course.nama}</CardTitle>
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
                        <Button type="button" variant="outline" disabled={!editable || mutation !== null} onClick={() => removeCourse(course)}><Trash2 />Hapus dari KRS</Button>
                      ) : (
                        <Button type="button" variant={warning ? "outline" : "default"} disabled={!editable || mutation !== null || Boolean(warning)} onClick={() => addCourse(course)}><Plus />Pilih Mata Kuliah</Button>
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
          {selectionPanel}
        </aside>
      </div>

      <button type="button" onClick={() => setSheetOpen(true)} className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center gap-3 rounded-2xl border border-border/70 bg-background px-4 text-left shadow-lg transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inset-x-5 lg:hidden" aria-label={`Buka KRS Saya, ${selectedCredits} SKS dipilih`}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileCheck2 className="size-[18px]" aria-hidden="true" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">KRS Saya</span><span className="block text-xs text-muted-foreground">{selectedCourses.length} mata kuliah · {selectedCredits} SKS</span></span>
        <ChevronRight className="size-5 text-muted-foreground" aria-hidden="true" />
      </button>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="max-h-[88dvh] gap-0 rounded-t-3xl border-border/70 bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
          <SheetHeader className="relative shrink-0 border-b px-4 pt-4 pb-4 pr-16">
            <SheetTitle className="text-lg font-semibold">KRS Saya</SheetTitle>
            <SheetDescription>{selectedCourses.length} mata kuliah dipilih untuk {academicYear}.</SheetDescription>
            <SheetClose aria-label="Tutup KRS Saya" className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X className="size-5" aria-hidden="true" /></SheetClose>
          </SheetHeader>
          {selectionPanel}
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
            <Button type="button" disabled={!canSubmit || dirty || mutation !== null} onClick={() => void submitKrs()}><Send />{mutation === "submitting" ? "Mengajukan..." : "Ya, Ajukan KRS"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
