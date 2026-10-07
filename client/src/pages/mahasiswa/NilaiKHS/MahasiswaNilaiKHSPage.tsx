import { useState } from "react"
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileClock,
  GraduationCap,
  Layers3,
  UserRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { courseGrades, gradeProfile, type CourseGrade, type GradeStatus } from "./nilai-khs-data"

type GradeTab = "grades" | "report"

const statusStyles: Record<GradeStatus, string> = {
  Final: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  "Belum Lengkap": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  "Belum Diumumkan": "border-border bg-muted text-muted-foreground",
}

function StatusBadge({ status }: { status: GradeStatus }) {
  return <Badge variant="outline" className={statusStyles[status]}>{status}</Badge>
}

function GradeValue({ course, compact = false }: { course: CourseGrade; compact?: boolean }) {
  if (course.status !== "Final") {
    return (
      <div className={cn("text-muted-foreground", compact ? "text-right" : "text-left sm:text-right")}>
        <p className="text-lg font-semibold">—</p>
        <p className="text-[11px]">Belum tersedia</p>
      </div>
    )
  }

  return (
    <div className={cn(compact ? "text-right" : "text-left sm:text-right")}>
      <p className="text-2xl font-semibold tracking-tight tabular-nums">{course.grade}</p>
      <p className="text-[11px] text-muted-foreground">Nilai {course.finalScore}</p>
    </div>
  )
}

function downloadReport() {
  const finalizedCourses = courseGrades.filter((course) => course.status === "Final")
  const rows = [
    ["KARTU HASIL STUDI"],
    ["Tahun Akademik", gradeProfile.academicYear],
    ["Semester", gradeProfile.semester],
    ["IPS", gradeProfile.semesterGpa],
    ["IPK", gradeProfile.gpa],
    [],
    ["Kode", "Mata Kuliah", "SKS", "Grade"],
    ...finalizedCourses.map((course) => [course.code, course.name, course.credits, course.grade ?? "-"]),
  ]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `KHS-${gradeProfile.academicYear.replace("/", "-")}-${gradeProfile.semester}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function MahasiswaNilaiKHSPage() {
  const [activeTab, setActiveTab] = useState<GradeTab>("grades")
  const [selectedCourse, setSelectedCourse] = useState<CourseGrade | null>(null)
  const progress = Math.round((gradeProfile.completedCredits / gradeProfile.requiredCredits) * 100)

  const summaries = [
    { label: "IPK", value: gradeProfile.gpa, note: "Kumulatif", icon: GraduationCap, tone: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
    { label: "IPS", value: gradeProfile.semesterGpa, note: "Semester ini", icon: BookOpenCheck, tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    { label: "SKS Semester", value: gradeProfile.semesterCredits, note: "7 mata kuliah", icon: Layers3, tone: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  ]

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7">
          <div aria-hidden="true" className="absolute -top-20 right-0 size-52 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-medium text-primary">Hasil studimu</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Nilai &amp; KHS</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pantau nilai mata kuliah dan ringkasan capaian akademik setiap semester.</p>
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <div className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Tahun Akademik</span><strong className="ml-2 font-medium">{gradeProfile.academicYear}</strong></span></div>
          <div className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Semester</span><strong className="ml-2 font-medium">{gradeProfile.semester}</strong></span></div>
        </div>
      </header>

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
          <div><h2 className="text-lg font-semibold">Nilai Mata Kuliah</h2><p className="mt-1 text-sm text-muted-foreground">Nilai akan tampil setelah diumumkan oleh dosen.</p></div>
          <div className="space-y-3">
            {courseGrades.map((course) => (
              <Card key={course.id} className="gap-3 transition-colors hover:ring-foreground/20">
                <CardContent className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{course.code}</Badge><span className="text-xs text-muted-foreground">{course.credits} SKS · Kelas {course.className}</span></div>
                    <h3 className="mt-2 font-semibold leading-5">{course.name}</h3>
                    <div className="mt-3"><StatusBadge status={course.status} /></div>
                  </div>
                  <GradeValue course={course} />
                  <Button type="button" variant="outline" onClick={() => setSelectedCourse(course)} className="w-full sm:w-auto"><Eye />Lihat Detail</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : (
        <section role="tabpanel" aria-label="Kartu hasil studi" className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)] lg:gap-6">
          <Card>
            <div className="flex flex-col gap-3 border-b border-border/70 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-semibold">Kartu Hasil Studi</h2><p className="mt-1 text-sm text-muted-foreground">{gradeProfile.semester} · {gradeProfile.academicYear}</p></div>
              <Button type="button" variant="outline" onClick={downloadReport}><Download />Download KHS</Button>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 pb-5 sm:grid-cols-4">
                {[
                  ["IPS", gradeProfile.semesterGpa],
                  ["IPK", gradeProfile.gpa],
                  ["SKS Semester", gradeProfile.semesterCredits],
                  ["Total SKS", gradeProfile.completedCredits],
                ].map(([label, value]) => <div key={label} className="rounded-xl bg-muted/45 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>)}
              </div>
              <ul className="divide-y divide-border/70">
                {courseGrades.map((course) => (
                  <li key={course.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold", course.status === "Final" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{course.grade ?? "—"}</span>
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium leading-5">{course.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{course.code} · {course.credits} SKS</p></div>
                    {course.status !== "Final" && <StatusBadge status={course.status} />}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="lg:sticky lg:top-5">
            <CardContent>
              <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold">Progress Akademik</p><p className="mt-1 text-xs text-muted-foreground">Menuju kelulusan</p></div><span className="text-lg font-semibold tabular-nums">{progress}%</span></div>
              <div role="progressbar" aria-label="Progress SKS kelulusan" aria-valuemin={0} aria-valuemax={gradeProfile.requiredCredits} aria-valuenow={gradeProfile.completedCredits} className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div>
              <div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="font-medium">{gradeProfile.completedCredits}/{gradeProfile.requiredCredits} SKS</span><span className="text-muted-foreground">Sisa {gradeProfile.requiredCredits - gradeProfile.completedCredits} SKS</span></div>
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 p-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" /><p className="text-xs leading-5 text-muted-foreground">Kamu telah menyelesaikan tiga perempat dari total SKS program studi.</p></div>
            </CardContent>
          </Card>
        </section>
      )}

      <Dialog open={Boolean(selectedCourse)} onOpenChange={(open) => !open && setSelectedCourse(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          {selectedCourse && (
            <>
              <DialogHeader>
                <div className="mb-1 flex flex-wrap items-center gap-2"><Badge variant="secondary">{selectedCourse.code}</Badge><StatusBadge status={selectedCourse.status} /></div>
                <DialogTitle className="text-lg leading-6">{selectedCourse.name}</DialogTitle>
                <DialogDescription>{selectedCourse.credits} SKS · Kelas {selectedCourse.className}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border bg-muted/20 p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><UserRound className="size-3.5" aria-hidden="true" />Dosen</p><p className="mt-2 text-sm font-medium leading-5">{selectedCourse.lecturer}</p></div>
                <div className="rounded-xl border bg-muted/20 p-3"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Layers3 className="size-3.5" aria-hidden="true" />Kelas</p><p className="mt-2 text-sm font-medium">{selectedCourse.className}</p></div>
              </div>
              <div>
                <h3 className="text-sm font-semibold">Komponen Nilai</h3>
                <div className="mt-3 divide-y divide-border/70 rounded-xl border px-4">
                  {selectedCourse.components.map((component) => (
                    <div key={component.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3 text-sm"><span>{component.label}</span><span className="text-xs text-muted-foreground">{component.weight}%</span><span className="w-8 text-right font-semibold tabular-nums">{component.score ?? "—"}</span></div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 p-4">
                <div><p className="flex items-center gap-2 text-xs text-muted-foreground"><FileClock className="size-3.5" aria-hidden="true" />Hasil akhir</p><p className="mt-1 text-sm font-medium">{selectedCourse.status}</p></div>
                <GradeValue course={selectedCourse} compact />
              </div>
              {selectedCourse.status !== "Final" && <p className="text-xs leading-5 text-muted-foreground">Nilai akhir dan grade tidak ditampilkan hingga seluruh komponen lengkap dan hasil diumumkan.</p>}
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
