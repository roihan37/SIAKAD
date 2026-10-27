import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import {
  AlertCircle,
  BookOpenCheck,
  Download,
  FileSearch,
  GraduationCap,
  Search,
} from "lucide-react"

import {
  getStudentTranscript,
  studentTranscriptErrorMessage,
} from "@/api/student-transcript"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { StudentGradeCourse } from "@/types/student-grades"
import type { StudentTranscript } from "@/types/student-transcript"

const allSemesters = "all"
const decimalFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function CourseGrade({ course }: { course: StudentGradeCourse }) {
  return (
    <span className="font-heading text-base font-semibold text-foreground">
      {course.grade ?? "-"}
    </span>
  )
}

function csvCell(value: string | number | null) {
  const rawValue = String(value ?? "")
  const safeValue = /^[=+\-@]/.test(rawValue) ? `'${rawValue}` : rawValue

  return `"${safeValue.replaceAll('"', '""')}"`
}

function downloadTranscript(transcript: StudentTranscript) {
  const rows = [
    ["Semester", "Tahun Akademik", "Kode", "Mata Kuliah", "SKS", "Nilai Angka", "Grade"],
    ...transcript.semesters.flatMap((semester) =>
      semester.courses.map((course) => [
        semester.semesterNumber,
        semester.academicYear.label,
        course.mataKuliah.kode,
        course.mataKuliah.nama,
        course.mataKuliah.sks,
        course.nilai,
        course.grade,
      ]),
    ),
  ]
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }))
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = "transkrip-nilai-mahasiswa.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

function TranscriptLoading() {
  return (
    <div className="space-y-5" aria-label="Memuat transkrip">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <Card key={item} size="sm" className={item === 2 ? "col-span-2 lg:col-span-1" : undefined}>
            <CardHeader><Skeleton className="h-4 w-28" /></CardHeader>
            <CardContent><Skeleton className="h-8 w-16" /></CardContent>
          </Card>
        ))}
      </section>
      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

export default function MahasiswaTranskripPage() {
  const [transcript, setTranscript] = useState<StudentTranscript | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [query, setQuery] = useState("")
  const [semesterFilter, setSemesterFilter] = useState(allSemesters)
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")

  useEffect(() => {
    const controller = new AbortController()

    async function loadTranscript() {
      setLoading(true)
      setError(null)

      try {
        setTranscript(await getStudentTranscript(controller.signal))
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(studentTranscriptErrorMessage(requestError, "Transkrip gagal dimuat."))
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadTranscript()
    return () => controller.abort()
  }, [retryKey])

  const filteredSemesters = useMemo(() => {
    if (!transcript) return []

    return transcript.semesters.flatMap((semester) => {
      if (semesterFilter !== allSemesters && String(semester.id) !== semesterFilter) return []

      const courses = normalizedQuery
        ? semester.courses.filter((course) =>
            `${course.mataKuliah.kode} ${course.mataKuliah.nama}`
              .toLocaleLowerCase("id-ID")
              .includes(normalizedQuery),
          )
        : semester.courses

      return courses.length ? [{ ...semester, courses }] : []
    })
  }, [normalizedQuery, semesterFilter, transcript])

  const totalCourses = transcript?.semesters.reduce(
    (total, semester) => total + semester.courses.length,
    0,
  ) ?? 0

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Riwayat akademik</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Transkrip Nilai</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ringkasan kumulatif semester dan mata kuliah yang telah memiliki nilai.
          </p>
        </div>
        <Button
          className="w-full sm:w-auto"
          disabled={!transcript || totalCourses === 0}
          onClick={() => transcript && downloadTranscript(transcript)}
        >
          <Download data-icon="inline-start" />
          Download Transkrip
        </Button>
      </header>

      {loading ? <TranscriptLoading /> : null}

      {!loading && error ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Transkrip tidak dapat dimuat</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => setRetryKey((key) => key + 1)}>
              Coba Lagi
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {!loading && !error && transcript && transcript.semesters.length > 0 ? (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Ringkasan transkrip">
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-xs font-medium text-muted-foreground">IPK Kumulatif</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-semibold">{decimalFormatter.format(transcript.cumulativeGpa)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Skala 4,00</p>
              </CardContent>
            </Card>
            <Card size="sm">
              <CardHeader>
                <CardTitle className="text-xs font-medium text-muted-foreground">SKS Dinilai</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-heading text-2xl font-semibold">{transcript.completedCredits}</p>
                <p className="mt-1 text-xs text-muted-foreground">Dari riwayat semester</p>
              </CardContent>
            </Card>
            <Card size="sm" className="col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Mata Kuliah</CardTitle>
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-3">
                <div>
                  <p className="font-heading text-2xl font-semibold">{totalCourses}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Memiliki nilai</p>
                </div>
                <BookOpenCheck className="size-7 text-primary/70" aria-hidden="true" />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3" aria-labelledby="semester-history-title">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 id="semester-history-title" className="font-heading text-lg font-semibold">Riwayat per Semester</h2>
                <p className="text-sm text-muted-foreground">Buka semester untuk melihat daftar mata kuliah dan nilai.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[minmax(16rem,1fr)_13rem] lg:w-[34rem]">
                <label className="relative">
                  <span className="sr-only">Cari kode atau nama mata kuliah</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Cari kode atau mata kuliah"
                    className="pl-9"
                  />
                </label>
                <Select value={semesterFilter} onValueChange={(value) => setSemesterFilter(value ?? allSemesters)}>
                  <SelectTrigger className="h-9 w-full" aria-label="Filter semester">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value={allSemesters}>Semua Semester</SelectItem>
                    {transcript.semesters.map((semester) => (
                      <SelectItem key={semester.id} value={String(semester.id)}>
                        Semester {semester.semesterNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredSemesters.length ? (
              <Card className="gap-0 py-0">
                <Accordion
                  key={`${semesterFilter}-${normalizedQuery}`}
                  defaultValue={[String(filteredSemesters[0].id)]}
                  className="divide-y"
                >
                  {filteredSemesters.map((semester) => (
                    <AccordionItem key={semester.id} value={String(semester.id)} className="border-0 px-4 sm:px-5">
                      <AccordionTrigger className="py-4 sm:py-5">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-heading text-base font-semibold">Semester {semester.semesterNumber}</span>
                            <span className="text-sm text-muted-foreground">{semester.academicYear.label}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span>IPS: <strong className="font-medium text-foreground">{decimalFormatter.format(semester.semesterGpa)}</strong></span>
                            <span>{semester.totalCredits} SKS</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="hidden md:block">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-28">Kode</TableHead>
                                <TableHead>Mata Kuliah</TableHead>
                                <TableHead className="w-20 text-center">SKS</TableHead>
                                <TableHead className="w-28 text-right">Nilai</TableHead>
                                <TableHead className="w-28 text-right">Grade</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {semester.courses.map((course) => (
                                <TableRow key={course.id}>
                                  <TableCell className="font-mono text-xs text-muted-foreground">{course.mataKuliah.kode}</TableCell>
                                  <TableCell className="whitespace-normal">
                                    <Link to="/mahasiswa/nilai-khs" className="font-medium hover:text-primary hover:underline hover:underline-offset-4">
                                      {course.mataKuliah.nama}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-center">{course.mataKuliah.sks}</TableCell>
                                  <TableCell className="text-right">{course.nilai ?? "-"}</TableCell>
                                  <TableCell className="text-right"><CourseGrade course={course} /></TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <div className="space-y-2 md:hidden">
                          {semester.courses.map((course) => (
                            <article key={course.id} className="rounded-lg border bg-muted/20 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {course.mataKuliah.kode} · {course.mataKuliah.sks} SKS
                                  </p>
                                  <Link to="/mahasiswa/nilai-khs" className="mt-1 block font-medium leading-snug hover:text-primary hover:underline">
                                    {course.mataKuliah.nama}
                                  </Link>
                                  <p className="mt-1 text-xs text-muted-foreground">Nilai: {course.nilai ?? "-"}</p>
                                </div>
                                <CourseGrade course={course} />
                              </div>
                            </article>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            ) : (
              <Card className="py-10 text-center">
                <CardContent className="flex flex-col items-center">
                  <div className="mb-3 grid size-11 place-items-center rounded-full bg-muted">
                    <FileSearch className="size-5 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-semibold">Nilai tidak ditemukan</h3>
                  <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                    Coba gunakan kata kunci lain atau pilih semester yang berbeda.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setSemesterFilter(allSemesters) }}>
                    Tampilkan Semua
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
            <GraduationCap className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Detail komponen nilai tetap tersedia pada halaman Nilai &amp; KHS.
          </div>
        </>
      ) : null}

      {!loading && !error && transcript && transcript.semesters.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="flex flex-col items-center">
            <div className="mb-3 grid size-11 place-items-center rounded-full bg-muted">
              <FileSearch className="size-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <h2 className="font-heading font-semibold">Transkrip belum tersedia</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Mata kuliah akan tampil setelah nilai tersedia pada riwayat akademik Anda.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
