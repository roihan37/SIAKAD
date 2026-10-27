import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  BookOpenCheck,
  CalendarDays,
  Download,
  FileSearch,
  GraduationCap,
  Layers3,
} from "lucide-react"

import {
  getStudentGradeAcademicYears,
  getStudentGrades,
  studentGradesErrorMessage,
} from "@/api/student-grades"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  StudentGradeAcademicYear,
  StudentGradeCourse,
  StudentGradeReport,
  StudentGradeUnavailableReason,
} from "@/types/student-grades"

type GradeTab = "grades" | "report"

const numberFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatSemester(semester: StudentGradeAcademicYear["semester"]) {
  return semester === "GANJIL" ? "Ganjil" : "Genap"
}

function formatGradeNumber(value: number | null) {
  return value === null ? "—" : numberFormatter.format(value)
}

function unavailableMessage(reason: StudentGradeUnavailableReason | null) {
  switch (reason) {
    case "KRS_NOT_APPROVED":
      return "KRS semester ini belum disetujui, sehingga nilai belum dapat ditampilkan."
    case "KRS_NOT_FOUND":
      return "Belum ada KRS untuk tahun akademik yang dipilih."
    case "GRADES_NOT_AVAILABLE":
      return "Nilai untuk semester ini belum tersedia."
    default:
      return "Belum ada nilai untuk tahun akademik yang dipilih."
  }
}

function csvCell(value: string | number | null) {
  let text = String(value ?? "")
  if (/^[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function downloadReport(report: StudentGradeReport) {
  const rows: Array<Array<string | number | null>> = [
    ["KARTU HASIL STUDI"],
    ["Tahun Akademik", report.tahunAkademik.tahun],
    ["Semester", formatSemester(report.tahunAkademik.semester)],
    ["IPS", report.summary.ips],
    ["IPK", report.summary.ipk],
    ["SKS Dinilai", report.summary.totalSKS],
    [],
    ["Kode", "Mata Kuliah", "SKS", "Nilai Angka", "Grade"],
    ...report.details.map((course) => [
      course.mataKuliah.kode,
      course.mataKuliah.nama,
      course.mataKuliah.sks,
      course.nilai,
      course.grade,
    ]),
  ]
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n")
  const url = URL.createObjectURL(
    new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
  )
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = `KHS-${report.tahunAkademik.tahun.replaceAll("/", "-")}-${formatSemester(report.tahunAkademik.semester)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

function GradeValue({ course }: { course: StudentGradeCourse }) {
  return (
    <div className="text-left sm:text-right">
      <p className="text-2xl font-semibold tracking-tight tabular-nums">
        {course.grade ?? "—"}
      </p>
      <p className="text-[11px] text-muted-foreground">
        Nilai {formatGradeNumber(course.nilai)}
      </p>
    </div>
  )
}

function GradeLoading() {
  return (
    <div className="space-y-5" aria-label="Memuat nilai">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className={cn("h-28", item === 2 && "col-span-2 sm:col-span-1")} />
        ))}
      </div>
      <Skeleton className="h-10 w-full sm:w-56" />
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    </div>
  )
}

export default function MahasiswaNilaiKHSPage() {
  const [activeTab, setActiveTab] = useState<GradeTab>("grades")
  const [academicYears, setAcademicYears] = useState<StudentGradeAcademicYear[]>([])
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [report, setReport] = useState<StudentGradeReport | null>(null)
  const [unavailableReason, setUnavailableReason] = useState<StudentGradeUnavailableReason | null>(null)
  const [yearsLoading, setYearsLoading] = useState(true)
  const [gradesLoading, setGradesLoading] = useState(false)
  const [yearsError, setYearsError] = useState<string | null>(null)
  const [gradesError, setGradesError] = useState<string | null>(null)
  const [yearsRequest, setYearsRequest] = useState(0)
  const [gradesRequest, setGradesRequest] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    void getStudentGradeAcademicYears(controller.signal)
      .then((years) => {
        const initialYear = years.find((year) => year.isActive) ?? years[0] ?? null
        setAcademicYears(years)
        setSelectedYearId(initialYear?.id ?? null)
        setYearsError(null)
        setYearsLoading(false)
        setGradesLoading(Boolean(initialYear))
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setYearsError(studentGradesErrorMessage(error, "Gagal memuat tahun akademik."))
        setYearsLoading(false)
      })

    return () => controller.abort()
  }, [yearsRequest])

  useEffect(() => {
    if (selectedYearId === null) return

    const controller = new AbortController()

    void getStudentGrades(selectedYearId, controller.signal)
      .then((result) => {
        setReport(result.nilai)
        setUnavailableReason(result.reason)
        setGradesError(null)
        setGradesLoading(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setReport(null)
        setUnavailableReason(null)
        setGradesError(studentGradesErrorMessage(error, "Gagal memuat nilai dan KHS."))
        setGradesLoading(false)
      })

    return () => controller.abort()
  }, [gradesRequest, selectedYearId])

  const selectedYear = useMemo(
    () => academicYears.find((year) => year.id === selectedYearId) ?? null,
    [academicYears, selectedYearId],
  )

  const summaries = report
    ? [
        { label: "IPK", value: numberFormatter.format(report.summary.ipk), note: "Kumulatif", icon: GraduationCap, tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
        { label: "IPS", value: numberFormatter.format(report.summary.ips), note: "Semester ini", icon: BookOpenCheck, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
        { label: "SKS Dinilai", value: report.summary.totalSKS, note: `${report.details.length} mata kuliah`, icon: Layers3, tone: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
      ]
    : []

  function retryAcademicYears() {
    setYearsLoading(true)
    setYearsError(null)
    setYearsRequest((request) => request + 1)
  }

  function retryGrades() {
    setGradesLoading(true)
    setGradesError(null)
    setGradesRequest((request) => request + 1)
  }

  function selectAcademicYear(value: string | null) {
    if (!value) return
    const yearId = Number(value)
    if (!Number.isInteger(yearId)) return

    setSelectedYearId(yearId)
    setReport(null)
    setUnavailableReason(null)
    setGradesError(null)
    setGradesLoading(true)
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Hasil studimu</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Nilai &amp; KHS</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pantau nilai mata kuliah dan ringkasan capaian akademik setiap semester.</p>
            </div>
            {!yearsLoading && !yearsError && academicYears.length > 0 && (
              <Select
                items={academicYears.map((year) => ({ value: String(year.id), label: `${formatSemester(year.semester)} · ${year.tahun}` }))}
                value={selectedYearId === null ? "" : String(selectedYearId)}
                onValueChange={selectAcademicYear}
              >
                <SelectTrigger className="h-10 w-full sm:w-56" aria-label="Pilih tahun akademik">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={String(year.id)}>
                      {formatSemester(year.semester)} · {year.tahun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
            <span><span className="text-muted-foreground">Tahun Akademik</span><strong className="ml-2 font-medium">{selectedYear?.tahun ?? "—"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4 text-muted-foreground" aria-hidden="true" />
            <span><span className="text-muted-foreground">Semester</span><strong className="ml-2 font-medium">{selectedYear ? formatSemester(selectedYear.semester) : "—"}</strong></span>
          </div>
        </div>
      </header>

      {yearsLoading ? (
        <GradeLoading />
      ) : yearsError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Data tahun akademik gagal dimuat</AlertTitle>
          <AlertDescription>{yearsError}</AlertDescription>
          <Button className="mt-3 w-fit" size="sm" variant="outline" onClick={retryAcademicYears}>Coba Lagi</Button>
        </Alert>
      ) : academicYears.length === 0 ? (
        <Card className="py-10 text-center">
          <CardContent className="flex flex-col items-center">
            <FileSearch className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-semibold">Tahun akademik belum tersedia</h2>
            <p className="mt-1 text-sm text-muted-foreground">Belum ada periode yang dapat dipilih untuk melihat nilai.</p>
          </CardContent>
        </Card>
      ) : gradesLoading ? (
        <GradeLoading />
      ) : gradesError ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Nilai dan KHS gagal dimuat</AlertTitle>
          <AlertDescription>{gradesError}</AlertDescription>
          <Button className="mt-3 w-fit" size="sm" variant="outline" onClick={retryGrades}>Coba Lagi</Button>
        </Alert>
      ) : !report || report.details.length === 0 ? (
        <Card className="py-10 text-center">
          <CardContent className="flex flex-col items-center">
            <FileSearch className="mb-3 size-8 text-muted-foreground" aria-hidden="true" />
            <h2 className="font-semibold">Nilai belum tersedia</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{unavailableMessage(unavailableReason)}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section aria-labelledby="grade-summary-title">
            <h2 id="grade-summary-title" className="sr-only">Ringkasan hasil studi</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {summaries.map(({ label, value, note, icon: Icon, tone }, index) => (
                <Card key={label} className={cn("gap-3", index === 2 && "col-span-2 sm:col-span-1")}>
                  <CardContent className="flex items-start justify-between gap-3">
                    <div><p className="text-xs text-muted-foreground sm:text-sm">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">{value}</p><p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">{note}</p></div>
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl sm:size-10", tone)}><Icon className="size-[18px] sm:size-5" aria-hidden="true" /></span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="flex w-full rounded-xl bg-muted p-1 sm:w-fit" role="tablist" aria-label="Pilih informasi hasil studi">
            <button type="button" role="tab" aria-selected={activeTab === "grades"} onClick={() => setActiveTab("grades")} className={cn("flex h-9 flex-1 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none", activeTab === "grades" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Nilai</button>
            <button type="button" role="tab" aria-selected={activeTab === "report"} onClick={() => setActiveTab("report")} className={cn("flex h-9 flex-1 items-center justify-center rounded-lg px-5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-none", activeTab === "report" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>KHS</button>
          </div>

          {activeTab === "grades" ? (
            <section role="tabpanel" aria-label="Daftar nilai" className="space-y-3">
              <div><h2 className="text-lg font-semibold">Nilai Mata Kuliah</h2><p className="mt-1 text-sm text-muted-foreground">Nilai final yang telah tersedia pada semester terpilih.</p></div>
              <div className="space-y-3">
                {report.details.map((course) => (
                  <Card key={course.id} className="gap-3">
                    <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{course.mataKuliah.kode}</Badge><span className="text-xs text-muted-foreground">{course.mataKuliah.sks} SKS</span></div>
                        <h3 className="mt-2 font-semibold leading-5">{course.mataKuliah.nama}</h3>
                      </div>
                      <GradeValue course={course} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : (
            <section role="tabpanel" aria-label="Kartu hasil studi">
              <Card>
                <div className="flex flex-col gap-3 border-b border-border/70 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div><h2 className="text-lg font-semibold">Kartu Hasil Studi</h2><p className="mt-1 text-sm text-muted-foreground">{report.tahunAkademik.label}</p></div>
                  <Button type="button" variant="outline" onClick={() => downloadReport(report)}><Download />Download KHS</Button>
                </div>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 pb-5 sm:grid-cols-4">
                    {[
                      ["IPS", numberFormatter.format(report.summary.ips)],
                      ["IPK", numberFormatter.format(report.summary.ipk)],
                      ["SKS Dinilai", report.summary.totalSKS],
                      ["Mata Kuliah", report.details.length],
                    ].map(([label, value]) => <div key={label} className="rounded-xl bg-muted/45 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>)}
                  </div>
                  <ul className="divide-y divide-border/70">
                    {report.details.map((course) => (
                      <li key={course.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">{course.grade ?? "—"}</span>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium leading-5">{course.mataKuliah.nama}</p><p className="mt-0.5 text-xs text-muted-foreground">{course.mataKuliah.kode} · {course.mataKuliah.sks} SKS</p></div>
                        <span className="text-sm font-medium tabular-nums">{formatGradeNumber(course.nilai)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
          )}
        </>
      )}
    </main>
  )
}
