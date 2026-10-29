import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Download,
  Eye,
  FileCheck2,
  FileSearch,
  FileText,
  GraduationCap,
  MessageSquareText,
  Search,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type ThesisStatus = "PROPOSAL" | "RESEARCH" | "WRITING" | "EXAM" | "COMPLETED"
type ReviewStatus = "NONE" | "PENDING" | "REVISION" | "APPROVED"
type DocumentStatus = "PENDING" | "REVISION" | "APPROVED"
type ListTab = "ALL" | "PENDING" | "REVISION" | "COMPLETED"
type DetailTab = "overview" | "history" | "documents" | "exam"

interface Feedback {
  id: number
  date: string
  lecturer: string
  note: string
  decision: "APPROVED" | "REVISION"
}

interface ThesisDocument {
  id: number
  name: string
  version: string
  uploadedAt: string
  status: DocumentStatus
  feedback: Feedback[]
}

interface GuidanceHistory {
  id: number
  date: string
  topic: string
  note: string
  status: "DONE" | "FOLLOW_UP"
}

interface ExamInfo {
  type: string
  date: string
  time: string
  room: string
  status: "SCHEDULED" | "COMPLETED"
}

interface ThesisStudent {
  id: number
  nim: string
  name: string
  program: string
  title: string
  supervisor: string
  thesisStatus: ThesisStatus
  reviewStatus: ReviewStatus
  milestoneIndex: number
  updatedAt: string
  nextAction: string
  abstract: string
  history: GuidanceHistory[]
  documents: ThesisDocument[]
  exam?: ExamInfo
}

const activeAcademicYear = "2026/2027 Ganjil"
const pageSize = 5
const milestones = ["Proposal", "Seminar Proposal", "Penelitian", "Penulisan", "Ujian/Sidang"]

const initialStudents: ThesisStudent[] = [
  {
    id: 1,
    nim: "231011400101",
    name: "Alya Putri Rahma",
    program: "Informatika",
    title: "Deteksi Penyakit Daun Padi Menggunakan Convolutional Neural Network",
    supervisor: "Dr. Andi Pratama, M.Kom.",
    thesisStatus: "WRITING",
    reviewStatus: "PENDING",
    milestoneIndex: 3,
    updatedAt: "28 Oktober 2026",
    nextAction: "Review revisi Bab III dan berikan umpan balik metodologi.",
    abstract: "Penelitian mengevaluasi pemanfaatan CNN untuk membantu klasifikasi penyakit daun padi dari citra digital.",
    history: [
      { id: 1, date: "12 September 2026", topic: "Bab I — Pendahuluan", note: "Rumusan masalah sudah dipersempit dan tujuan penelitian diperjelas.", status: "DONE" },
      { id: 2, date: "3 Oktober 2026", topic: "Bab II — Studi Literatur", note: "Tambahkan perbandingan dengan dua penelitian terkini.", status: "FOLLOW_UP" },
      { id: 3, date: "22 Oktober 2026", topic: "Bab III — Metodologi", note: "Alur augmentasi data perlu dijelaskan lebih rinci.", status: "FOLLOW_UP" },
    ],
    documents: [
      { id: 101, name: "Bab III - Metodologi.pdf", version: "v3", uploadedAt: "28 Oktober 2026", status: "PENDING", feedback: [
        { id: 1, date: "22 Oktober 2026", lecturer: "Dr. Andi Pratama, M.Kom.", note: "Jelaskan pembagian data latih, validasi, dan uji.", decision: "REVISION" },
      ] },
      { id: 102, name: "Bab II - Studi Literatur.pdf", version: "v2", uploadedAt: "10 Oktober 2026", status: "APPROVED", feedback: [
        { id: 2, date: "11 Oktober 2026", lecturer: "Dr. Andi Pratama, M.Kom.", note: "Revisi sudah sesuai, dapat dilanjutkan.", decision: "APPROVED" },
      ] },
    ],
  },
  {
    id: 2,
    nim: "231011400118",
    name: "Bima Aditya Saputra",
    program: "Informatika",
    title: "Sistem Rekomendasi Mata Kuliah Pilihan Berbasis Collaborative Filtering",
    supervisor: "Dr. Andi Pratama, M.Kom.",
    thesisStatus: "RESEARCH",
    reviewStatus: "REVISION",
    milestoneIndex: 2,
    updatedAt: "26 Oktober 2026",
    nextAction: "Mahasiswa memperbaiki rancangan evaluasi berdasarkan feedback terakhir.",
    abstract: "Penelitian merancang rekomendasi mata kuliah pilihan dengan memanfaatkan pola pengambilan mata kuliah mahasiswa.",
    history: [
      { id: 4, date: "18 September 2026", topic: "Proposal", note: "Ruang lingkup pengguna dan data sudah disepakati.", status: "DONE" },
      { id: 5, date: "20 Oktober 2026", topic: "Rancangan Evaluasi", note: "Metrik evaluasi perlu disesuaikan dengan karakteristik data.", status: "FOLLOW_UP" },
    ],
    documents: [
      { id: 201, name: "Rancangan Eksperimen.pdf", version: "v1", uploadedAt: "26 Oktober 2026", status: "REVISION", feedback: [
        { id: 3, date: "27 Oktober 2026", lecturer: "Dr. Andi Pratama, M.Kom.", note: "Tambahkan baseline dan alasan pemilihan metrik.", decision: "REVISION" },
      ] },
    ],
  },
  {
    id: 3,
    nim: "231011400126",
    name: "Citra Maharani",
    program: "Sistem Informasi",
    title: "Evaluasi Pengalaman Pengguna Portal Akademik dengan Metode UEQ",
    supervisor: "Dr. Andi Pratama, M.Kom.",
    thesisStatus: "EXAM",
    reviewStatus: "APPROVED",
    milestoneIndex: 4,
    updatedAt: "24 Oktober 2026",
    nextAction: "Persiapan seminar hasil sesuai jadwal yang tersedia.",
    abstract: "Penelitian mengukur kualitas pengalaman pengguna portal akademik melalui instrumen User Experience Questionnaire.",
    history: [
      { id: 6, date: "9 September 2026", topic: "Instrumen Penelitian", note: "Kuesioner dan karakteristik responden telah disetujui.", status: "DONE" },
      { id: 7, date: "18 Oktober 2026", topic: "Bab IV — Hasil", note: "Interpretasi hasil sudah konsisten dengan temuan.", status: "DONE" },
    ],
    documents: [
      { id: 301, name: "Naskah Seminar Hasil.pdf", version: "v4", uploadedAt: "24 Oktober 2026", status: "APPROVED", feedback: [
        { id: 4, date: "25 Oktober 2026", lecturer: "Dr. Andi Pratama, M.Kom.", note: "Naskah siap diajukan untuk seminar hasil.", decision: "APPROVED" },
      ] },
    ],
    exam: { type: "Seminar Hasil", date: "6 November 2026", time: "09.00–10.30", room: "Ruang Sidang 2", status: "SCHEDULED" },
  },
  {
    id: 4,
    nim: "221011400087",
    name: "Daffa Rizky Ramadhan",
    program: "Informatika",
    title: "Optimasi Rute Distribusi Menggunakan Algoritma Genetika",
    supervisor: "Dr. Andi Pratama, M.Kom.",
    thesisStatus: "COMPLETED",
    reviewStatus: "APPROVED",
    milestoneIndex: 5,
    updatedAt: "15 Oktober 2026",
    nextAction: "Seluruh tahapan bimbingan telah selesai.",
    abstract: "Penelitian mengoptimalkan rute distribusi dengan pendekatan algoritma genetika pada studi kasus logistik lokal.",
    history: [
      { id: 8, date: "2 Oktober 2026", topic: "Finalisasi Naskah", note: "Perbaikan tata tulis dan lampiran selesai.", status: "DONE" },
      { id: 9, date: "15 Oktober 2026", topic: "Pasca Sidang", note: "Revisi hasil sidang telah diverifikasi.", status: "DONE" },
    ],
    documents: [
      { id: 401, name: "Naskah Skripsi Final.pdf", version: "Final", uploadedAt: "15 Oktober 2026", status: "APPROVED", feedback: [
        { id: 5, date: "15 Oktober 2026", lecturer: "Dr. Andi Pratama, M.Kom.", note: "Revisi akhir telah sesuai.", decision: "APPROVED" },
      ] },
    ],
    exam: { type: "Sidang Skripsi", date: "10 Oktober 2026", time: "13.00–14.30", room: "Ruang Sidang 1", status: "COMPLETED" },
  },
  {
    id: 5,
    nim: "231011400139",
    name: "Fajar Nur Hidayat",
    program: "Sistem Informasi",
    title: "Perancangan Dashboard Monitoring Layanan Akademik Berbasis Web",
    supervisor: "Dr. Andi Pratama, M.Kom.",
    thesisStatus: "PROPOSAL",
    reviewStatus: "PENDING",
    milestoneIndex: 0,
    updatedAt: "29 Oktober 2026",
    nextAction: "Review draft proposal dan ruang lingkup indikator dashboard.",
    abstract: "Penelitian merancang dashboard untuk membantu pemantauan indikator layanan akademik secara ringkas.",
    history: [
      { id: 10, date: "17 Oktober 2026", topic: "Topik dan Ruang Lingkup", note: "Fokus penelitian diarahkan pada indikator layanan akademik.", status: "DONE" },
    ],
    documents: [
      { id: 501, name: "Draft Proposal.pdf", version: "v1", uploadedAt: "29 Oktober 2026", status: "PENDING", feedback: [] },
    ],
  },
  {
    id: 6,
    nim: "231011400144",
    name: "Gita Larasati",
    program: "Informatika",
    title: "Analisis Sentimen Ulasan Layanan Pendidikan Menggunakan IndoBERT",
    supervisor: "Dr. Andi Pratama, M.Kom.",
    thesisStatus: "WRITING",
    reviewStatus: "REVISION",
    milestoneIndex: 3,
    updatedAt: "23 Oktober 2026",
    nextAction: "Menunggu revisi pembahasan hasil dari mahasiswa.",
    abstract: "Penelitian menganalisis sentimen pada ulasan layanan pendidikan dengan model bahasa Indonesia.",
    history: [
      { id: 11, date: "14 Oktober 2026", topic: "Bab IV — Pembahasan", note: "Hubungkan hasil pengujian dengan temuan studi sebelumnya.", status: "FOLLOW_UP" },
    ],
    documents: [
      { id: 601, name: "Bab IV - Hasil dan Pembahasan.pdf", version: "v2", uploadedAt: "23 Oktober 2026", status: "REVISION", feedback: [
        { id: 6, date: "24 Oktober 2026", lecturer: "Dr. Andi Pratama, M.Kom.", note: "Pembahasan perlu menekankan penyebab kesalahan klasifikasi.", decision: "REVISION" },
      ] },
    ],
  },
]

const thesisLabels: Record<ThesisStatus, string> = {
  PROPOSAL: "Proposal",
  RESEARCH: "Penelitian",
  WRITING: "Penulisan",
  EXAM: "Ujian",
  COMPLETED: "Selesai",
}

const reviewLabels: Record<ReviewStatus, string> = {
  NONE: "Belum Ada Dokumen",
  PENDING: "Menunggu Review",
  REVISION: "Perlu Revisi",
  APPROVED: "Disetujui",
}

const reviewStyles: Record<ReviewStatus, string> = {
  NONE: "bg-muted text-muted-foreground",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  REVISION: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
}

const documentStyles: Record<DocumentStatus, string> = {
  PENDING: reviewStyles.PENDING,
  REVISION: reviewStyles.REVISION,
  APPROVED: reviewStyles.APPROVED,
}

const documentLabels: Record<DocumentStatus, string> = {
  PENDING: "Menunggu Review",
  REVISION: "Perlu Revisi",
  APPROVED: "Disetujui",
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("")
}

function progressFor(student: ThesisStudent) {
  return Math.round((student.milestoneIndex / milestones.length) * 100)
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof UserRound; tone: string }) {
  return <Card className="gap-3 py-4"><CardContent className="flex items-center gap-3 px-4"><div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", tone)}><Icon className="size-5" /></div><div><p className="text-2xl font-semibold tabular-nums">{value}</p><p className="text-xs text-muted-foreground sm:text-sm">{label}</p></div></CardContent></Card>
}

function ReviewBadge({ status }: { status: ReviewStatus }) {
  return <Badge className={cn("border-0", reviewStyles[status])}>{reviewLabels[status]}</Badge>
}

function ThesisBadge({ status }: { status: ThesisStatus }) {
  return <Badge variant="outline">{thesisLabels[status]}</Badge>
}

function ProgressBar({ student, compact = false }: { student: ThesisStudent; compact?: boolean }) {
  const progress = progressFor(student)
  return <div className={cn("space-y-1.5", compact ? "min-w-28" : "w-full")}><div className="flex items-center justify-between gap-2 text-xs"><span className="text-muted-foreground">{student.milestoneIndex}/{milestones.length} tahap</span><span className="font-medium tabular-nums">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${progress}%` }} /></div></div>
}

function LoadingList() {
  return <div className="space-y-3">{Array.from({ length: 5 }, (_, index) => <div key={index} className="flex items-center gap-4 rounded-xl border p-4"><Skeleton className="size-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-44" /><Skeleton className="h-3 w-3/4" /></div><Skeleton className="hidden h-9 w-28 sm:block" /></div>)}</div>
}

function DetailTabs({ active, onChange }: { active: DetailTab; onChange: (tab: DetailTab) => void }) {
  const tabs: { value: DetailTab; label: string }[] = [
    { value: "overview", label: "Overview" },
    { value: "history", label: "Riwayat Bimbingan" },
    { value: "documents", label: "Dokumen" },
    { value: "exam", label: "Ujian" },
  ]
  return <div className="overflow-x-auto"><div className="inline-flex min-w-full gap-1 rounded-xl bg-muted p-1 sm:min-w-0" role="tablist" aria-label="Detail bimbingan">{tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={active === tab.value} onClick={() => onChange(tab.value)} className={cn("min-w-max flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active === tab.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{tab.label}</button>)}</div></div>
}

function OverviewTab({ student }: { student: ThesisStudent }) {
  return <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
    <Card><CardHeader><CardTitle className="text-base">Informasi Skripsi</CardTitle></CardHeader><CardContent className="space-y-4"><div><p className="text-xs text-muted-foreground">Judul</p><p className="mt-1 font-medium leading-relaxed">{student.title}</p></div><div><p className="text-xs text-muted-foreground">Ringkasan</p><p className="mt-1 text-sm leading-relaxed">{student.abstract}</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Tahap Saat Ini</p><p className="mt-1 font-medium">{thesisLabels[student.thesisStatus]}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Status Review</p><div className="mt-1"><ReviewBadge status={student.reviewStatus} /></div></div></div></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Progress Milestone</CardTitle></CardHeader><CardContent className="space-y-4"><ProgressBar student={student} /> <div className="space-y-0">{milestones.map((milestone, index) => { const complete = index < student.milestoneIndex || student.milestoneIndex === milestones.length; const current = index === student.milestoneIndex && student.milestoneIndex < milestones.length; return <div key={milestone} className="flex gap-3"><div className="flex flex-col items-center"><div className={cn("flex size-6 items-center justify-center rounded-full border text-xs", complete ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary bg-primary/10 text-primary" : "bg-background text-muted-foreground")}>{complete ? <Check className="size-3.5" /> : index + 1}</div>{index < milestones.length - 1 && <div className={cn("h-8 w-px", complete ? "bg-primary" : "bg-border")} />}</div><div className="pt-0.5"><p className={cn("text-sm", current && "font-medium text-primary", !complete && !current && "text-muted-foreground")}>{milestone}</p>{current && <p className="text-xs text-muted-foreground">Tahap berjalan</p>}</div></div>})}</div><div className="rounded-xl border border-primary/20 bg-primary/5 p-3"><p className="text-xs font-medium text-primary">Tindakan Berikutnya</p><p className="mt-1 text-sm">{student.nextAction}</p></div></CardContent></Card>
  </div>
}

function HistoryTab({ student }: { student: ThesisStudent }) {
  if (student.history.length === 0) return <EmptyState title="Belum ada riwayat bimbingan" description="Riwayat pertemuan bimbingan akan tampil di sini." />
  return <Card><CardHeader><CardTitle className="text-base">Riwayat Bimbingan</CardTitle></CardHeader><CardContent><div className="space-y-0">{student.history.map((item, index) => <div key={item.id} className="flex gap-4"><div className="flex flex-col items-center"><div className={cn("mt-1 size-3 rounded-full ring-4 ring-background", item.status === "DONE" ? "bg-emerald-500" : "bg-amber-500")} />{index < student.history.length - 1 && <div className="min-h-24 w-px flex-1 bg-border" />}</div><div className="min-w-0 flex-1 pb-6"><div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium">{item.topic}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.note}</p></div><Badge variant="outline" className="w-fit shrink-0">{item.status === "DONE" ? "Selesai" : "Tindak Lanjut"}</Badge></div><p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" />{item.date}</p></div></div>)}</div></CardContent></Card>
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"><FileSearch className="size-10 text-muted-foreground/60" /><h3 className="mt-3 font-medium">{title}</h3><p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p></div>
}

function DocumentsTab({ student, onReview, onDownload }: { student: ThesisStudent; onReview: (document: ThesisDocument) => void; onDownload: (document: ThesisDocument) => void }) {
  if (student.documents.length === 0) return <EmptyState title="Belum ada dokumen" description="Dokumen revisi mahasiswa akan tampil di sini setelah diunggah." />
  return <div className="space-y-4">{student.documents.map((document) => <Card key={document.id} className="gap-4 py-4"><CardContent className="space-y-4 px-4 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="size-5" /></div><div className="min-w-0"><p className="break-words font-medium">{document.name}</p><p className="mt-1 text-xs text-muted-foreground">{document.version} · Diunggah {document.uploadedAt}</p></div></div><Badge className={cn("w-fit border-0", documentStyles[document.status])}>{documentLabels[document.status]}</Badge></div><div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" size="sm" onClick={() => onReview(document)}><Eye /> Lihat & Review</Button><Button variant="ghost" size="sm" onClick={() => onDownload(document)}><Download /> Download</Button></div>{document.feedback.length > 0 && <div className="rounded-xl bg-muted/50 p-4"><p className="text-sm font-medium">Riwayat Feedback</p><div className="mt-3 space-y-3">{document.feedback.map((feedback) => <div key={feedback.id} className="border-l-2 border-border pl-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{feedback.decision === "APPROVED" ? "Disetujui" : "Minta Revisi"}</Badge><span className="text-xs text-muted-foreground">{feedback.date}</span></div><p className="mt-1 text-sm">{feedback.note}</p><p className="mt-1 text-xs text-muted-foreground">{feedback.lecturer}</p></div>)}</div></div>}</CardContent></Card>)}</div>
}

function ExamTab({ student }: { student: ThesisStudent }) {
  if (!student.exam) return <EmptyState title="Belum ada jadwal ujian" description="Informasi seminar atau sidang belum tersedia pada data dummy mahasiswa ini." />
  return <Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{student.exam.type}</CardTitle><p className="mt-1 text-sm text-muted-foreground">Informasi ujian dari data simulasi.</p></div><Badge className={cn("border-0", student.exam.status === "COMPLETED" ? reviewStyles.APPROVED : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300")}>{student.exam.status === "COMPLETED" ? "Selesai" : "Terjadwal"}</Badge></div></CardHeader><CardContent><dl className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Tanggal</dt><dd className="mt-1 font-medium">{student.exam.date}</dd></div><div className="rounded-xl bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Waktu</dt><dd className="mt-1 font-medium">{student.exam.time}</dd></div><div className="rounded-xl bg-muted/50 p-4"><dt className="text-xs text-muted-foreground">Ruangan</dt><dd className="mt-1 font-medium">{student.exam.room}</dd></div></dl></CardContent></Card>
}

function DetailHeader({ student, onBack }: { student: ThesisStudent; onBack: () => void }) {
  return <><Button variant="ghost" className="-ml-2 w-fit" onClick={onBack}><ArrowLeft /> Kembali ke Daftar</Button><Card><CardContent className="p-5"><div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div className="flex min-w-0 items-start gap-4"><Avatar className="size-14"><AvatarFallback className="bg-primary/10 text-primary">{initials(student.name)}</AvatarFallback></Avatar><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold sm:text-2xl">{student.name}</h1><Badge variant="secondary"><Database /> Data Dummy</Badge></div><p className="mt-1 text-sm text-muted-foreground">{student.nim} · {student.program}</p><p className="mt-3 max-w-3xl font-medium leading-relaxed">{student.title}</p></div></div><div className="flex shrink-0 flex-wrap gap-2"><ThesisBadge status={student.thesisStatus} /><ReviewBadge status={student.reviewStatus} /></div></div><div className="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs text-muted-foreground">Dosen Pembimbing</p><p className="mt-1 text-sm font-medium">{student.supervisor}</p></div><div><p className="text-xs text-muted-foreground">Tahap</p><p className="mt-1 text-sm font-medium">{thesisLabels[student.thesisStatus]}</p></div><div><p className="text-xs text-muted-foreground">Update Terakhir</p><p className="mt-1 text-sm font-medium">{student.updatedAt}</p></div><div><p className="text-xs text-muted-foreground">Progress</p><div className="mt-1"><ProgressBar student={student} compact /></div></div></div></CardContent></Card></>
}

function DocumentReviewDialog({ document, note, error, onNoteChange, onClose, onApprove, onRevision }: { document: ThesisDocument | null; note: string; error: string; onNoteChange: (value: string) => void; onClose: () => void; onApprove: () => void; onRevision: () => void }) {
  return <Dialog open={Boolean(document)} onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Review Dokumen</DialogTitle><DialogDescription>Simulasi tampilan dokumen dan pemberian feedback. File tidak dikirim ke server.</DialogDescription></DialogHeader>{document && <div className="space-y-4"><div className="flex items-start gap-3 rounded-xl border p-4"><FileText className="mt-0.5 size-5 shrink-0 text-primary" /><div className="min-w-0"><p className="break-words font-medium">{document.name}</p><p className="mt-1 text-xs text-muted-foreground">{document.version} · {document.uploadedAt}</p></div></div><div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 p-6 text-center"><FileSearch className="size-9 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Pratinjau dokumen dummy</p><p className="mt-1 text-xs text-muted-foreground">Konten file tidak tersedia karena halaman ini belum terintegrasi penyimpanan dokumen.</p></div><div><label htmlFor="review-note" className="text-sm font-medium">Catatan Review</label><Textarea id="review-note" className="mt-2 min-h-28" value={note} onChange={(event) => onNoteChange(event.target.value)} placeholder="Tulis catatan yang jelas untuk mahasiswa" aria-invalid={Boolean(error)} />{error && <p className="mt-2 text-sm text-destructive">{error}</p>}<p className="mt-2 text-xs text-muted-foreground">Catatan wajib untuk aksi Minta Revisi dan opsional untuk persetujuan.</p></div></div>}<DialogFooter className="gap-2 sm:justify-between"><Button variant="outline" onClick={onClose}>Batal</Button><div className="flex flex-col-reverse gap-2 sm:flex-row"><Button variant="destructive" onClick={onRevision}><MessageSquareText /> Minta Revisi</Button><Button onClick={onApprove}><CheckCircle2 /> Setujui</Button></div></DialogFooter></DialogContent></Dialog>
}

function ApprovalDialog({ open, documentName, onOpenChange, onConfirm }: { open: boolean; documentName: string; onOpenChange: (open: boolean) => void; onConfirm: () => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>Setujui dokumen ini?</DialogTitle><DialogDescription>Status <span className="font-medium text-foreground">{documentName}</span> akan diperbarui menjadi Disetujui pada state dummy. Feedback lama tetap tersimpan.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button onClick={onConfirm}><CheckCircle2 /> Ya, Setujui</Button></DialogFooter></DialogContent></Dialog>
}

export default function DosenBimbinganSkripsiPage() {
  const [students, setStudents] = useState(initialStudents)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ListTab>("ALL")
  const [search, setSearch] = useState("")
  const [thesisFilter, setThesisFilter] = useState("ALL")
  const [reviewFilter, setReviewFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>("overview")
  const [reviewDocumentId, setReviewDocumentId] = useState<number | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  const [reviewError, setReviewError] = useState("")
  const [approvalOpen, setApprovalOpen] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 350)
    return () => window.clearTimeout(timer)
  }, [])

  const selected = students.find((student) => student.id === selectedId) ?? null
  const reviewDocument = selected?.documents.find((document) => document.id === reviewDocumentId) ?? null
  const counts = useMemo(() => ({
    total: students.length,
    pending: students.filter((student) => student.reviewStatus === "PENDING").length,
    revision: students.filter((student) => student.reviewStatus === "REVISION").length,
    completed: students.filter((student) => student.thesisStatus === "COMPLETED").length,
  }), [students])

  const filtered = useMemo(() => students.filter((student) => {
    const query = search.trim().toLowerCase()
    const tabMatch = activeTab === "ALL"
      || (activeTab === "PENDING" && student.reviewStatus === "PENDING")
      || (activeTab === "REVISION" && student.reviewStatus === "REVISION")
      || (activeTab === "COMPLETED" && student.thesisStatus === "COMPLETED")
    return (!query || student.nim.includes(query) || student.name.toLowerCase().includes(query) || student.title.toLowerCase().includes(query))
      && tabMatch
      && (thesisFilter === "ALL" || student.thesisStatus === thesisFilter)
      && (reviewFilter === "ALL" || student.reviewStatus === reviewFilter)
  }), [activeTab, reviewFilter, search, students, thesisFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const resetPage = () => setPage(1)

  const openDetail = (student: ThesisStudent) => {
    setSelectedId(student.id)
    setDetailTab("overview")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openReview = (document: ThesisDocument) => {
    setReviewDocumentId(document.id)
    setReviewNote("")
    setReviewError("")
  }

  const closeReview = () => {
    setReviewDocumentId(null)
    setReviewNote("")
    setReviewError("")
  }

  const updateDocument = (decision: "APPROVED" | "REVISION") => {
    if (!selected || !reviewDocument) {
      toast.error("Dokumen tidak dapat diproses.")
      return
    }
    const note = reviewNote.trim()
    if (decision === "REVISION" && !note) {
      setReviewError("Catatan wajib diisi ketika meminta revisi.")
      toast.error("Lengkapi catatan revisi terlebih dahulu.")
      return
    }
    const feedback: Feedback = {
      id: Date.now(),
      date: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date()),
      lecturer: selected.supervisor,
      note: note || "Dokumen telah ditinjau dan disetujui.",
      decision,
    }
    setStudents((current) => current.map((student) => student.id !== selected.id ? student : {
      ...student,
      reviewStatus: decision === "APPROVED" ? "APPROVED" : "REVISION",
      updatedAt: feedback.date,
      nextAction: decision === "APPROVED" ? "Dokumen disetujui; mahasiswa dapat melanjutkan tahap berikutnya." : "Menunggu mahasiswa mengunggah revisi berdasarkan feedback terbaru.",
      documents: student.documents.map((document) => document.id !== reviewDocument.id ? document : {
        ...document,
        status: decision,
        feedback: [...document.feedback, feedback],
      }),
    }))
    toast.success(decision === "APPROVED" ? "Dokumen berhasil disetujui." : "Permintaan revisi berhasil disimpan.")
    setApprovalOpen(false)
    closeReview()
  }

  if (selected) return <div className="space-y-5">
    <DetailHeader student={selected} onBack={() => setSelectedId(null)} />
    <DetailTabs active={detailTab} onChange={setDetailTab} />
    {detailTab === "overview" && <OverviewTab student={selected} />}
    {detailTab === "history" && <HistoryTab student={selected} />}
    {detailTab === "documents" && <DocumentsTab student={selected} onReview={openReview} onDownload={(document) => toast.info(`Download ${document.name} hanya simulasi data dummy.`)} />}
    {detailTab === "exam" && <ExamTab student={selected} />}
    <DocumentReviewDialog document={reviewDocument} note={reviewNote} error={reviewError} onNoteChange={(value) => { setReviewNote(value); if (value.trim()) setReviewError("") }} onClose={closeReview} onApprove={() => setApprovalOpen(true)} onRevision={() => updateDocument("REVISION")} />
    <ApprovalDialog open={approvalOpen} documentName={reviewDocument?.name ?? "dokumen"} onOpenChange={setApprovalOpen} onConfirm={() => updateDocument("APPROVED")} />
  </div>

  const tabs: { value: ListTab; label: string }[] = [
    { value: "ALL", label: "Semua" },
    { value: "PENDING", label: "Menunggu Review" },
    { value: "REVISION", label: "Perlu Revisi" },
    { value: "COMPLETED", label: "Selesai" },
  ]

  return <div className="space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Bimbingan Skripsi</h1><Badge variant="secondary"><Database /> Data Dummy</Badge></div><p className="mt-1 text-sm text-muted-foreground">Pantau progres dan review dokumen mahasiswa bimbingan Anda.</p></div><div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm"><CalendarDays className="size-4 text-primary" /><div><p className="text-[11px] text-muted-foreground">Tahun Akademik Aktif</p><p className="font-medium">{activeAcademicYear}</p></div></div></header>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><SummaryCard label="Total Mahasiswa Bimbingan" value={counts.total} icon={GraduationCap} tone="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" /><SummaryCard label="Menunggu Review" value={counts.pending} icon={Clock3} tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" /><SummaryCard label="Perlu Revisi" value={counts.revision} icon={MessageSquareText} tone="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" /><SummaryCard label="Selesai" value={counts.completed} icon={FileCheck2} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" /></div>

    <Card><CardHeader><CardTitle className="text-base">Daftar Mahasiswa Bimbingan</CardTitle><p className="text-sm text-muted-foreground">Hanya menampilkan mahasiswa skripsi yang dibimbing oleh dosen ini.</p></CardHeader><CardContent className="space-y-4">
      <div className="overflow-x-auto"><div className="inline-flex min-w-full gap-1 rounded-xl bg-muted p-1 sm:min-w-0" role="tablist" aria-label="Status bimbingan">{tabs.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={activeTab === tab.value} onClick={() => { setActiveTab(tab.value); setThesisFilter("ALL"); setReviewFilter("ALL"); resetPage() }} className={cn("min-w-max flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeTab === tab.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{tab.label}</button>)}</div></div>
      <div className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_210px_210px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="Cari NIM, nama, atau judul skripsi" /></div><Select value={thesisFilter} onValueChange={(value) => { if (value) { setThesisFilter(value); resetPage() } }}><SelectTrigger className="w-full"><SelectValue placeholder="Status Skripsi" /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Status Skripsi</SelectItem><SelectItem value="PROPOSAL">Proposal</SelectItem><SelectItem value="RESEARCH">Penelitian</SelectItem><SelectItem value="WRITING">Penulisan</SelectItem><SelectItem value="EXAM">Ujian</SelectItem><SelectItem value="COMPLETED">Selesai</SelectItem></SelectContent></Select><Select value={reviewFilter} onValueChange={(value) => { if (value) { setReviewFilter(value); resetPage() } }}><SelectTrigger className="w-full"><SelectValue placeholder="Status Review" /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Status Review</SelectItem><SelectItem value="PENDING">Menunggu Review</SelectItem><SelectItem value="REVISION">Perlu Revisi</SelectItem><SelectItem value="APPROVED">Disetujui</SelectItem></SelectContent></Select></div>

      {isLoading ? <LoadingList /> : visible.length === 0 ? <EmptyState title="Mahasiswa tidak ditemukan" description="Coba ubah tab, kata pencarian, atau filter yang digunakan." /> : <>
        <div className="hidden overflow-hidden rounded-xl border md:block"><Table><TableHeader><TableRow><TableHead>NIM</TableHead><TableHead>Mahasiswa</TableHead><TableHead className="min-w-72">Judul Skripsi</TableHead><TableHead>Tahap</TableHead><TableHead className="min-w-36">Progress</TableHead><TableHead>Status Review</TableHead><TableHead>Update Terakhir</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{visible.map((student) => <TableRow key={student.id}><TableCell className="font-medium">{student.nim}</TableCell><TableCell><p className="font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.program}</p></TableCell><TableCell><p className="line-clamp-2 text-sm leading-relaxed">{student.title}</p></TableCell><TableCell><ThesisBadge status={student.thesisStatus} /></TableCell><TableCell><ProgressBar student={student} compact /></TableCell><TableCell><ReviewBadge status={student.reviewStatus} /></TableCell><TableCell className="text-sm">{student.updatedAt}</TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openDetail(student)}>Lihat Bimbingan <ChevronRight /></Button></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="grid gap-3 md:hidden">{visible.map((student) => <Card key={student.id} className="gap-4 py-4"><CardContent className="space-y-4 px-4"><div className="flex items-start gap-3"><Avatar><AvatarFallback className="bg-primary/10 text-primary">{initials(student.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.nim} · {student.program}</p></div></div><p className="text-sm font-medium leading-relaxed">{student.title}</p><div className="flex flex-wrap gap-2"><ThesisBadge status={student.thesisStatus} /><ReviewBadge status={student.reviewStatus} /></div><ProgressBar student={student} /><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Update terakhir</span><span>{student.updatedAt}</span></div><Button className="w-full" variant="outline" onClick={() => openDetail(student)}>Lihat Bimbingan <ChevronRight /></Button></CardContent></Card>)}</div>
      </>}

      {!isLoading && filtered.length > 0 && <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length} mahasiswa</p><div className="flex items-center justify-between gap-2 sm:justify-end"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft /> Sebelumnya</Button><span className="min-w-16 text-center text-xs text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Berikutnya <ChevronRight /></Button></div></div>}
    </CardContent></Card>
  </div>
}
