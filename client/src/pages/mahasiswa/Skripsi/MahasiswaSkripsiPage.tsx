import { useState, type ComponentType } from "react"
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  GraduationCap,
  MapPin,
  MessageSquareText,
  Upload,
  UserRound,
  UsersRound,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  guidanceHistory,
  thesisDocuments,
  thesisExams,
  thesisMilestones,
  thesisProfile,
  thesisScenarios,
  type DocumentStatus,
  type GuidanceStatus,
  type ThesisDocument,
  type ThesisScenario,
  type ThesisScenarioId,
} from "./skripsi-data"

type ThesisTab = "overview" | "guidance" | "documents" | "exams"

const tabs: { id: ThesisTab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: GraduationCap },
  { id: "guidance", label: "Bimbingan", icon: MessageSquareText },
  { id: "documents", label: "Dokumen", icon: FileText },
  { id: "exams", label: "Ujian", icon: UsersRound },
]

const statusStyles: Record<string, string> = {
  "Belum Memiliki Skripsi": "border-border bg-muted text-muted-foreground",
  "Menunggu Review": "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  "Perlu Revisi": "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  "Skripsi Selesai": "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Disetujui: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Selesai: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Terjadwal: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant="outline" className={statusStyles[status] ?? "border-border bg-muted text-muted-foreground"}>{status}</Badge>
}

function getProgress(scenario: ThesisScenario) {
  if (!scenario.currentMilestone) return 0
  const index = thesisMilestones.indexOf(scenario.currentMilestone)
  return Math.round(((index + 1) / thesisMilestones.length) * 100)
}

function ProgressTracker({ scenario }: { scenario: ThesisScenario }) {
  const currentIndex = scenario.currentMilestone ? thesisMilestones.indexOf(scenario.currentMilestone) : -1
  const progress = getProgress(scenario)

  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Progress Skripsi</h2>
            <p className="mt-1 text-xs text-muted-foreground">{scenario.currentMilestone ? `Tahap saat ini: ${scenario.currentMilestone}` : "Belum ada proses yang dimulai"}</p>
          </div>
          <span className="text-xl font-semibold tabular-nums">{progress}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Progress tahapan skripsi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
        </div>

        <ol className="mt-6 space-y-0 md:hidden" aria-label="Tahapan skripsi">
          {thesisMilestones.map((milestone, index) => {
            const completed = index < currentIndex || scenario.id === "completed"
            const current = index === currentIndex && scenario.id !== "completed"
            return (
              <li key={milestone} className="relative flex min-h-14 gap-3 last:min-h-0">
                {index < thesisMilestones.length - 1 && <span aria-hidden="true" className={cn("absolute left-[15px] top-8 h-[calc(100%-1rem)] w-px", index < currentIndex ? "bg-primary" : "bg-border")} />}
                <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", completed ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10" : "border-border bg-card text-muted-foreground")}>
                  {completed ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                <div className="pt-1.5">
                  <p className={cn("text-sm font-medium", !completed && !current && "text-muted-foreground")}>{milestone}</p>
                  {current && <p className="mt-0.5 text-xs font-medium text-primary">Tahap saat ini</p>}
                </div>
              </li>
            )
          })}
        </ol>

        <ol className="mt-7 hidden grid-cols-8 md:grid" aria-label="Tahapan skripsi">
          {thesisMilestones.map((milestone, index) => {
            const completed = index < currentIndex || scenario.id === "completed"
            const current = index === currentIndex && scenario.id !== "completed"
            return (
              <li key={milestone} className="relative flex min-w-0 flex-col items-center px-1 text-center">
                {index > 0 && <span aria-hidden="true" className={cn("absolute right-1/2 top-4 h-px w-full", index <= currentIndex ? "bg-primary" : "bg-border")} />}
                <span className={cn("relative z-10 flex size-8 items-center justify-center rounded-full border bg-card text-xs font-semibold", completed ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary bg-primary/10 text-primary ring-4 ring-primary/10" : "border-border text-muted-foreground")}>
                  {completed ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                </span>
                <span className={cn("relative z-10 mt-3 text-[11px] leading-4", completed || current ? "font-medium text-foreground" : "text-muted-foreground")}>{milestone}</span>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

function OverviewTab({ scenario }: { scenario: ThesisScenario }) {
  if (!scenario.title) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-8 text-center sm:py-12">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted"><GraduationCap className="size-6 text-muted-foreground" aria-hidden="true" /></span>
          <h2 className="mt-4 font-semibold">Belum ada data skripsi</h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">Mulai dari pengajuan judul. Informasi pembimbing dan progres akan tampil di workspace ini setelah pengajuan diproses.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
      <Card>
        <CardContent>
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" aria-hidden="true" /></span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Judul Skripsi</p>
              <h2 className="mt-2 text-lg font-semibold leading-7">{scenario.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-2"><StatusBadge status={scenario.status} /><span className="text-xs text-muted-foreground">Diajukan {scenario.submittedAt}</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <h2 className="font-semibold">Tim Pembimbing</h2>
          <div className="mt-4 space-y-4">
            {thesisProfile.supervisors.map((supervisor) => (
              <div key={supervisor.role} className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{supervisor.initials}</span>
                <div className="min-w-0"><p className="text-sm font-medium leading-5">{supervisor.name}</p><p className="text-xs text-muted-foreground">{supervisor.role}</p></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

function GuidanceTab({ scenario, onUpload }: { scenario: ThesisScenario; onUpload: () => void }) {
  if (!scenario.title || scenario.id === "awaiting-review") return <EmptyWorkspace icon={MessageSquareText} title="Belum ada riwayat bimbingan" description="Riwayat konsultasi dan catatan pembimbing akan tampil setelah pembimbing ditetapkan." />

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h2 className="text-lg font-semibold">Riwayat Bimbingan</h2><p className="mt-1 text-sm text-muted-foreground">Catatan konsultasi terbaru ditampilkan paling atas.</p></div>
        {scenario.id === "needs-revision" && <Button type="button" onClick={onUpload}><Upload />Upload Revisi</Button>}
      </div>
      <ol className="relative space-y-4 before:absolute before:bottom-5 before:left-[17px] before:top-5 before:w-px before:bg-border">
        {guidanceHistory.map((entry, index) => (
          <li key={entry.id} className="relative pl-12">
            <span className={cn("absolute left-2.5 top-5 z-10 size-4 rounded-full border-4 border-background", index === 0 ? "bg-amber-500" : "bg-primary")} />
            <Card>
              <CardContent>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><p className="text-xs text-muted-foreground">{entry.date}</p><h3 className="mt-1 font-semibold">{entry.topic}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="size-3.5" aria-hidden="true" />{entry.supervisor}</p></div>
                  <StatusBadge status={entry.status as GuidanceStatus} />
                </div>
                <div className="mt-4 rounded-xl bg-muted/45 p-3"><p className="text-xs font-medium text-muted-foreground">Catatan pembimbing</p><p className="mt-1 text-sm leading-6">{entry.note}</p></div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  )
}

function DocumentsTab({ scenario, onView }: { scenario: ThesisScenario; onView: (document: ThesisDocument) => void }) {
  if (!scenario.title || scenario.id === "awaiting-review") return <EmptyWorkspace icon={FileText} title="Belum ada dokumen" description="Dokumen proposal, naskah, dan administrasi akan tersimpan di sini setelah proses skripsi dimulai." />

  return (
    <section>
      <div className="mb-4"><h2 className="text-lg font-semibold">Dokumen Skripsi</h2><p className="mt-1 text-sm text-muted-foreground">Satu tempat untuk naskah, dokumen pendukung, dan status review.</p></div>
      <div className="space-y-3">
        {thesisDocuments.map((document) => (
          <Card key={document.id}>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{document.name}</h3><StatusBadge status={document.status as DocumentStatus} /></div><p className="mt-1 text-xs text-muted-foreground">{document.type} · {document.date} · {document.size}</p></div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button type="button" variant="outline" onClick={() => onView(document)}><Eye />Lihat</Button>
                <Button type="button" variant="outline" onClick={() => downloadDummyDocument(document)}><Download />Download</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function ExamsTab({ scenario }: { scenario: ThesisScenario }) {
  if (scenario.id === "not-started" || scenario.id === "awaiting-review") return <EmptyWorkspace icon={CalendarDays} title="Belum ada jadwal ujian" description="Jadwal Seminar Hasil atau Sidang akan tampil setelah persyaratan dan persetujuan pembimbing terpenuhi." />

  return (
    <section>
      <div className="mb-4"><h2 className="text-lg font-semibold">Seminar &amp; Sidang</h2><p className="mt-1 text-sm text-muted-foreground">Informasi pelaksanaan dan tim penguji skripsi.</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        {thesisExams.map((exam) => (
          <Card key={exam.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-primary">Ujian Skripsi</p><h3 className="mt-1 text-lg font-semibold">{exam.type}</h3></div><StatusBadge status={exam.status} /></div>
              <div className="mt-5 grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
                <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span><span className="block text-xs text-muted-foreground">Tanggal</span>{exam.date}</span></p>
                <p className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span><span className="block text-xs text-muted-foreground">Waktu</span>{exam.time}</span></p>
                <p className="flex items-start gap-2 sm:col-span-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><span><span className="block text-xs text-muted-foreground">Ruangan</span>{exam.room}</span></p>
              </div>
              <div className="mt-5"><p className="text-xs font-medium text-muted-foreground">Tim Penguji</p><ul className="mt-2 space-y-2">{exam.examiners.map((examiner) => <li key={examiner} className="flex items-center gap-2 text-sm"><span className="size-1.5 rounded-full bg-primary" />{examiner}</li>)}</ul></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function EmptyWorkspace({ icon: Icon, title, description }: { icon: ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center py-9 text-center sm:py-12">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-muted"><Icon className="size-6 text-muted-foreground" aria-hidden="true" /></span>
        <h2 className="mt-4 font-semibold">{title}</h2><p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

function downloadDummyDocument(document: ThesisDocument) {
  const content = `Dokumen dummy SIAKAD\n\n${document.name}\nJenis: ${document.type}\nTanggal: ${document.date}\nStatus: ${document.status}`
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }))
  const anchor = window.document.createElement("a")
  anchor.href = url
  anchor.download = `${document.name.replaceAll(" ", "-").toLowerCase()}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function MahasiswaSkripsiPage() {
  const [scenarioId, setScenarioId] = useState<ThesisScenarioId>("needs-revision")
  const [activeTab, setActiveTab] = useState<ThesisTab>("overview")
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState("")
  const [uploadSuccess, setUploadSuccess] = useState("")
  const [selectedDocument, setSelectedDocument] = useState<ThesisDocument | null>(null)
  const scenario = thesisScenarios[scenarioId]

  function changeScenario(value: string | null) {
    if (!value) return
    setScenarioId(value as ThesisScenarioId)
    setActiveTab("overview")
    setUploadSuccess("")
  }

  function handlePrimaryAction() {
    if (scenario.id === "needs-revision") {
      setUploadOpen(true)
      return
    }
    setActiveTab(scenario.id === "completed" ? "documents" : "overview")
  }

  function submitRevision() {
    if (!selectedFile) return
    setUploadSuccess(selectedFile)
    setUploadOpen(false)
    setActiveTab("guidance")
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="relative px-5 py-6 sm:px-7">
          <div aria-hidden="true" className="absolute -right-16 -top-20 size-56 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-primary">Workspace akademik</p><StatusBadge status={scenario.status} /></div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Skripsi</h1>
              <p className={cn("mt-2 text-sm leading-6", scenario.title ? "font-medium text-foreground" : "text-muted-foreground")}>{scenario.title ?? "Kelola proses skripsi dari pengajuan judul hingga selesai."}</p>
            </div>
            <div className="w-full rounded-xl border bg-background/70 p-3 lg:w-64">
              <Label htmlFor="thesis-demo-state" className="mb-2 block text-xs text-muted-foreground">Data demo</Label>
              <Select value={scenarioId} onValueChange={changeScenario}>
                <SelectTrigger id="thesis-demo-state" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent align="end">
                  {Object.values(thesisScenarios).map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="grid gap-3 border-t bg-muted/30 px-5 py-4 text-sm sm:grid-cols-2 sm:px-7">
          <p className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Mahasiswa</span><strong className="ml-2 font-medium">{thesisProfile.student}</strong></span></p>
          <p className="flex items-center gap-2"><GraduationCap className="size-4 text-muted-foreground" aria-hidden="true" /><span><span className="text-muted-foreground">Program Studi</span><strong className="ml-2 font-medium">{thesisProfile.studyProgram}</strong></span></p>
        </div>
      </header>

      <ProgressTracker scenario={scenario} />

      <Card className={cn("border-0 ring-1", scenario.id === "completed" ? "bg-emerald-50/70 ring-emerald-200 dark:bg-emerald-950/30 dark:ring-emerald-900" : "bg-primary text-primary-foreground ring-primary")}>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", scenario.id === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200" : "bg-primary-foreground/15")}>
              {scenario.id === "completed" ? <CheckCircle2 className="size-5" aria-hidden="true" /> : <AlertCircle className="size-5" aria-hidden="true" />}
            </span>
            <div><p className={cn("text-xs font-medium uppercase tracking-wide", scenario.id === "completed" ? "text-emerald-700 dark:text-emerald-300" : "text-primary-foreground/75")}>Yang Perlu Kamu Lakukan</p><h2 className="mt-1 text-lg font-semibold">{scenario.nextAction.title}</h2><p className={cn("mt-1 max-w-3xl text-sm leading-6", scenario.id === "completed" ? "text-emerald-800/80 dark:text-emerald-200/80" : "text-primary-foreground/80")}>{scenario.nextAction.description}</p>{scenario.nextAction.deadline && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium"><CalendarDays className="size-3.5" aria-hidden="true" />Batas unggah: {scenario.nextAction.deadline}</p>}</div>
          </div>
          <Button type="button" variant={scenario.id === "completed" ? "outline" : "secondary"} className="w-full shrink-0 sm:w-auto" onClick={handlePrimaryAction}>{scenario.nextAction.actionLabel}<ChevronRight /></Button>
        </CardContent>
      </Card>

      {uploadSuccess && <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"><FileCheck2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="text-sm font-semibold">Revisi tersimpan sebagai draft</p><p className="mt-1 text-xs">{uploadSuccess} siap diperiksa sebelum dikirim ke pembimbing.</p></div></div>}

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max rounded-xl bg-muted p-1" role="tablist" aria-label="Workspace skripsi">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} className={cn("flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeTab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><Icon className="size-4" aria-hidden="true" />{label}</button>)}
        </div>
      </div>

      <div role="tabpanel">
        {activeTab === "overview" && <OverviewTab scenario={scenario} />}
        {activeTab === "guidance" && <GuidanceTab scenario={scenario} onUpload={() => setUploadOpen(true)} />}
        {activeTab === "documents" && <DocumentsTab scenario={scenario} onView={setSelectedDocument} />}
        {activeTab === "exams" && <ExamsTab scenario={scenario} />}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Upload Revisi Skripsi</DialogTitle><DialogDescription>Simpan file revisi sebagai draft. Data dummy ini tidak dikirim ke server atau pembimbing.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-1">
            <div><Label htmlFor="revision-file">File revisi</Label><Input id="revision-file" className="mt-2" type="file" accept=".pdf,.doc,.docx" onChange={(event) => setSelectedFile(event.target.files?.[0]?.name ?? "")} /><p className="mt-1.5 text-xs text-muted-foreground">PDF atau DOCX, maksimal 10 MB.</p></div>
            <div><Label htmlFor="revision-note">Catatan revisi</Label><Textarea id="revision-note" className="mt-2" placeholder="Ringkas bagian yang sudah diperbaiki..." /></div>
          </div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>Batal</Button><Button type="button" disabled={!selectedFile} onClick={submitRevision}><Upload />Simpan Draft</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedDocument)} onOpenChange={(open) => !open && setSelectedDocument(null)}>
        <DialogContent className="sm:max-w-md">
          {selectedDocument && <><DialogHeader><DialogTitle>{selectedDocument.name}</DialogTitle><DialogDescription>Preview metadata dokumen skripsi.</DialogDescription></DialogHeader><div className="rounded-xl border bg-muted/30 p-4"><dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm"><dt className="text-muted-foreground">Jenis</dt><dd className="font-medium">{selectedDocument.type}</dd><dt className="text-muted-foreground">Tanggal</dt><dd className="font-medium">{selectedDocument.date}</dd><dt className="text-muted-foreground">Ukuran</dt><dd className="font-medium">{selectedDocument.size}</dd><dt className="text-muted-foreground">Status</dt><dd><StatusBadge status={selectedDocument.status} /></dd></dl></div><DialogFooter><Button type="button" variant="outline" onClick={() => downloadDummyDocument(selectedDocument)}><Download />Download</Button></DialogFooter></>}
        </DialogContent>
      </Dialog>
    </main>
  )
}
