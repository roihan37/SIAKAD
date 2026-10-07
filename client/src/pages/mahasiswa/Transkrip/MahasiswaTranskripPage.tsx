import { useMemo, useState } from "react"
import { Link } from "react-router"
import {
  BookOpenCheck,
  Download,
  FileSearch,
  GraduationCap,
  Search,
} from "lucide-react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { transcriptProfile, transcriptSemesters, type TranscriptCourse } from "./transkrip-data"

const allSemesters = "all"

function CourseStatus({ course }: { course: TranscriptCourse }) {
  if (course.status === "Final") {
    return <span className="font-heading text-base font-semibold text-foreground">{course.grade}</span>
  }

  return (
    <Badge variant="secondary" className="h-auto whitespace-normal py-1 text-center">
      {course.status}
    </Badge>
  )
}

function downloadTranscript() {
  const rows = [
    ["Semester", "Tahun Akademik", "Kode", "Mata Kuliah", "SKS", "Nilai/Status"],
    ...transcriptSemesters.flatMap((semester) =>
      semester.courses.map((course) => [
        semester.label,
        semester.academicYear,
        course.code,
        course.name,
        course.credits,
        course.grade ?? course.status,
      ]),
    ),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = "transkrip-nilai-mahasiswa.csv"
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function MahasiswaTranskripPage() {
  const [query, setQuery] = useState("")
  const [semesterFilter, setSemesterFilter] = useState(allSemesters)
  const normalizedQuery = query.trim().toLocaleLowerCase("id-ID")

  const filteredSemesters = useMemo(() => {
    return transcriptSemesters.flatMap((semester) => {
      if (semesterFilter !== allSemesters && semester.id !== semesterFilter) return []

      const courses = normalizedQuery
        ? semester.courses.filter((course) =>
            `${course.code} ${course.name}`.toLocaleLowerCase("id-ID").includes(normalizedQuery),
          )
        : semester.courses

      return courses.length ? [{ ...semester, courses }] : []
    })
  }, [normalizedQuery, semesterFilter])

  const totalCourses = transcriptSemesters.reduce((total, semester) => total + semester.courses.length, 0)
  const studyProgress = Math.round((transcriptProfile.completedCredits / transcriptProfile.requiredCredits) * 100)

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 py-5 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Riwayat akademik</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">Transkrip Nilai</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ringkasan kumulatif seluruh semester dan mata kuliah yang telah atau sedang ditempuh.
          </p>
        </div>
        <Button className="w-full sm:w-auto" onClick={downloadTranscript}>
          <Download data-icon="inline-start" />
          Download Transkrip
        </Button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Ringkasan transkrip">
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">IPK Kumulatif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-semibold">{transcriptProfile.cumulativeGpa}</p>
            <p className="mt-1 text-xs text-muted-foreground">Skala 4,00</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">SKS Ditempuh</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-2xl font-semibold">{transcriptProfile.completedCredits}</p>
            <p className="mt-1 text-xs text-muted-foreground">SKS selesai</p>
          </CardContent>
        </Card>
        <Card size="sm" className="col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Mata Kuliah</CardTitle>
          </CardHeader>
          <CardContent className="flex items-end justify-between gap-3">
            <div>
              <p className="font-heading text-2xl font-semibold">{totalCourses}</p>
              <p className="mt-1 text-xs text-muted-foreground">Termasuk semester berjalan</p>
            </div>
            <BookOpenCheck className="size-7 text-primary/70" aria-hidden="true" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <CardTitle>Progress Studi</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {transcriptProfile.completedCredits} dari {transcriptProfile.requiredCredits} SKS kurikulum telah diselesaikan.
            </p>
          </div>
          <p className="font-heading text-xl font-semibold text-primary">{studyProgress}%</p>
        </CardHeader>
        <CardContent>
          <div
            className="h-2.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Progress studi"
            aria-valuemin={0}
            aria-valuemax={transcriptProfile.requiredCredits}
            aria-valuenow={transcriptProfile.completedCredits}
          >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${studyProgress}%` }} />
          </div>
        </CardContent>
      </Card>

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
                {transcriptSemesters.map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>{semester.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredSemesters.length ? (
          <Card className="gap-0 py-0">
            <Accordion
              key={`${semesterFilter}-${normalizedQuery}`}
              defaultValue={[filteredSemesters[0].id]}
              className="divide-y"
            >
              {filteredSemesters.map((semester) => (
                <AccordionItem key={semester.id} value={semester.id} className="border-0 px-4 sm:px-5">
                  <AccordionTrigger className="py-4 sm:py-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-heading text-base font-semibold">{semester.label}</span>
                        <span className="text-sm text-muted-foreground">{semester.academicYear}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>IPS: <strong className="font-medium text-foreground">{semester.semesterGpa ?? "Belum tersedia"}</strong></span>
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
                            <TableHead className="w-44 text-right">Grade / Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {semester.courses.map((course) => (
                            <TableRow key={course.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">{course.code}</TableCell>
                              <TableCell className="whitespace-normal">
                                <Link to="/mahasiswa/nilai-khs" className="font-medium hover:text-primary hover:underline hover:underline-offset-4">
                                  {course.name}
                                </Link>
                              </TableCell>
                              <TableCell className="text-center">{course.credits}</TableCell>
                              <TableCell className="text-right"><CourseStatus course={course} /></TableCell>
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
                              <p className="font-mono text-xs text-muted-foreground">{course.code} · {course.credits} SKS</p>
                              <Link to="/mahasiswa/nilai-khs" className="mt-1 block font-medium leading-snug hover:text-primary hover:underline">
                                {course.name}
                              </Link>
                            </div>
                            <CourseStatus course={course} />
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
    </div>
  )
}
