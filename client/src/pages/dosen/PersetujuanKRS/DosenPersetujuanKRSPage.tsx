import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileSearch,
  Search,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type KrsStatus = "PENDING" | "APPROVED" | "REJECTED"
type StatusTab = "PENDING" | "APPROVED" | "REJECTED" | "ALL"

type KrsCourse = {
  code: string
  name: string
  credits: number
  className: string
  schedule: string
  lecturer: string
}

type KrsSubmission = {
  id: number
  nim: string
  name: string
  program: string
  cohort: number
  semester: number
  gpa: number
  creditLimit: number
  academicYear: string
  submittedAt: string
  status: KrsStatus
  rejectionReason?: string
  validation: { scheduleConflict: boolean; exceedsCreditLimit: boolean }
  courses: KrsCourse[]
}

const activeAcademicYear = "2026/2027 Ganjil"
const pageSize = 5

const coursePool: KrsCourse[] = [
  { code: "IF401", name: "Pemrograman Web Lanjut", credits: 3, className: "TI-4A", schedule: "Senin, 08.00–10.30", lecturer: "Dr. Budi Santoso, M.Kom." },
  { code: "IF403", name: "Kecerdasan Buatan", credits: 3, className: "TI-4A", schedule: "Selasa, 09.50–12.20", lecturer: "Rina Kusuma, M.Kom." },
  { code: "IF405", name: "Keamanan Informasi", credits: 3, className: "TI-4A", schedule: "Rabu, 08.00–10.30", lecturer: "Ahmad Fikri, M.Cs." },
  { code: "IF407", name: "Manajemen Proyek TI", credits: 2, className: "TI-4A", schedule: "Kamis, 13.00–14.40", lecturer: "Dr. Budi Santoso, M.Kom." },
  { code: "IF409", name: "Metodologi Penelitian", credits: 3, className: "TI-4A", schedule: "Jumat, 08.00–10.30", lecturer: "Dewi Anggraini, M.Kom." },
  { code: "IF411", name: "Komputasi Awan", credits: 3, className: "TI-4B", schedule: "Kamis, 08.00–10.30", lecturer: "Rizal Maulana, M.Kom." },
  { code: "IF413", name: "Interaksi Manusia dan Komputer", credits: 3, className: "TI-4B", schedule: "Jumat, 13.00–15.30", lecturer: "Nadia Putri, M.Kom." },
  { code: "SI401", name: "Audit Sistem Informasi", credits: 3, className: "SI-4A", schedule: "Senin, 10.40–13.10", lecturer: "Fajar Nugraha, M.Kom." },
]

const initialSubmissions: KrsSubmission[] = [
  { id: 1, nim: "231011001", name: "Alya Putri Ramadhani", program: "Informatika", cohort: 2023, semester: 7, gpa: 3.82, creditLimit: 24, academicYear: activeAcademicYear, submittedAt: "27 Oktober 2026, 09.14", status: "PENDING", validation: { scheduleConflict: false, exceedsCreditLimit: false }, courses: coursePool.slice(0, 7) },
  { id: 2, nim: "231011014", name: "Nabila Rahmawati", program: "Informatika", cohort: 2023, semester: 7, gpa: 3.71, creditLimit: 24, academicYear: activeAcademicYear, submittedAt: "27 Oktober 2026, 10.22", status: "PENDING", validation: { scheduleConflict: true, exceedsCreditLimit: false }, courses: [coursePool[0], coursePool[1], coursePool[2], coursePool[3], coursePool[5], coursePool[6]] },
  { id: 3, nim: "241011005", name: "Salsabila Nur Azizah", program: "Informatika", cohort: 2024, semester: 5, gpa: 3.65, creditLimit: 22, academicYear: activeAcademicYear, submittedAt: "28 Oktober 2026, 08.05", status: "PENDING", validation: { scheduleConflict: false, exceedsCreditLimit: true }, courses: [...coursePool.slice(0, 7), { code: "IF415", name: "Topik Khusus Informatika", credits: 3, className: "TI-4A", schedule: "Sabtu, 08.00–10.30", lecturer: "Dr. Budi Santoso, M.Kom." }] },
  { id: 4, nim: "241021009", name: "Intan Permata Sari", program: "Sistem Informasi", cohort: 2024, semester: 5, gpa: 3.77, creditLimit: 24, academicYear: activeAcademicYear, submittedAt: "28 Oktober 2026, 11.40", status: "PENDING", validation: { scheduleConflict: false, exceedsCreditLimit: false }, courses: [coursePool[7], coursePool[1], coursePool[3], coursePool[4], coursePool[6]] },
  { id: 5, nim: "251021003", name: "Muhammad Farhan", program: "Sistem Informasi", cohort: 2025, semester: 3, gpa: 3.44, creditLimit: 22, academicYear: activeAcademicYear, submittedAt: "29 Oktober 2026, 07.55", status: "PENDING", validation: { scheduleConflict: false, exceedsCreditLimit: false }, courses: [coursePool[7], coursePool[1], coursePool[3], coursePool[5], coursePool[6]] },
  { id: 6, nim: "231011007", name: "Dimas Arya Pratama", program: "Informatika", cohort: 2023, semester: 7, gpa: 3.48, creditLimit: 22, academicYear: activeAcademicYear, submittedAt: "24 Oktober 2026, 13.18", status: "APPROVED", validation: { scheduleConflict: false, exceedsCreditLimit: false }, courses: coursePool.slice(0, 6) },
  { id: 7, nim: "241011012", name: "Fajar Aditya Nugraha", program: "Informatika", cohort: 2024, semester: 5, gpa: 3.36, creditLimit: 22, academicYear: activeAcademicYear, submittedAt: "25 Oktober 2026, 09.32", status: "APPROVED", validation: { scheduleConflict: false, exceedsCreditLimit: false }, courses: coursePool.slice(1, 7) },
  { id: 8, nim: "251011016", name: "Citra Ayu Lestari", program: "Informatika", cohort: 2025, semester: 3, gpa: 3.58, creditLimit: 22, academicYear: activeAcademicYear, submittedAt: "23 Oktober 2026, 15.10", status: "REJECTED", rejectionReason: "Jadwal mata kuliah perlu disesuaikan karena bertabrakan dengan kelas wajib.", validation: { scheduleConflict: true, exceedsCreditLimit: false }, courses: coursePool.slice(0, 6) },
  { id: 9, nim: "231011021", name: "Rizky Maulana", program: "Informatika", cohort: 2023, semester: 7, gpa: 3.12, creditLimit: 20, academicYear: activeAcademicYear, submittedAt: "22 Oktober 2026, 10.45", status: "REJECTED", rejectionReason: "Total SKS perlu disesuaikan dengan batas SKS semester ini.", validation: { scheduleConflict: false, exceedsCreditLimit: true }, courses: coursePool.slice(0, 7) },
]

const tabOptions: Array<{ value: StatusTab; label: string }> = [
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "ALL", label: "Semua" },
]

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("")
}

function totalCredits(submission: KrsSubmission) {
  return submission.courses.reduce((total, course) => total + course.credits, 0)
}

function statusLabel(status: KrsStatus) {
  if (status === "APPROVED") return "Disetujui"
  if (status === "REJECTED") return "Ditolak"
  return "Menunggu"
}

function StatusBadge({ status }: { status: KrsStatus }) {
  const style = status === "APPROVED"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
    : status === "REJECTED"
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
      : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
  return <Badge variant="outline" className={style}>{statusLabel(status)}</Badge>
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof ClipboardCheck; tone: string }) {
  return <Card className="gap-3 py-4"><CardContent className="flex items-start justify-between gap-3 px-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">Pengajuan KRS</p></div><span className={cn("rounded-xl p-2.5", tone)}><Icon className="size-5" /></span></CardContent></Card>
}

function LoadingList() {
  return <div className="space-y-3" aria-label="Memuat pengajuan KRS"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
}

function ReviewDetail({ submission, onBack, onApprove, onReject }: { submission: KrsSubmission; onBack: () => void; onApprove: () => void; onReject: () => void }) {
  const credits = totalCredits(submission)
  const hasWarning = submission.validation.scheduleConflict || submission.validation.exceedsCreditLimit

  return <div className="space-y-5">
    <Button variant="ghost" onClick={onBack}><ArrowLeft /> Kembali ke daftar</Button>
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Review KRS</h1><Badge variant="secondary"><Database /> Data Dummy</Badge></div><p className="mt-1 text-sm text-muted-foreground">Tinjau pengajuan tanpa mengubah pilihan mata kuliah mahasiswa.</p></div><StatusBadge status={submission.status} /></header>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="text-base">Identitas Mahasiswa</CardTitle></CardHeader><CardContent className="flex items-start gap-4"><Avatar className="size-14"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials(submission.name)}</AvatarFallback></Avatar><dl className="grid min-w-0 flex-1 grid-cols-2 gap-3 text-sm"><div className="col-span-2"><dt className="text-xs text-muted-foreground">Nama / NIM</dt><dd className="mt-1 font-medium">{submission.name} · {submission.nim}</dd></div><div><dt className="text-xs text-muted-foreground">Program Studi</dt><dd className="mt-1 font-medium">{submission.program}</dd></div><div><dt className="text-xs text-muted-foreground">Semester</dt><dd className="mt-1 font-medium">{submission.semester}</dd></div><div><dt className="text-xs text-muted-foreground">IPK</dt><dd className="mt-1 font-medium">{submission.gpa.toFixed(2)}</dd></div><div><dt className="text-xs text-muted-foreground">Batas SKS</dt><dd className="mt-1 font-medium">{submission.creditLimit} SKS</dd></div></dl></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Informasi KRS</CardTitle></CardHeader><CardContent><dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">Tahun Akademik</dt><dd className="mt-1 font-medium">{submission.academicYear}</dd></div><div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1"><StatusBadge status={submission.status} /></dd></div><div><dt className="text-xs text-muted-foreground">Tanggal Pengajuan</dt><dd className="mt-1 font-medium">{submission.submittedAt}</dd></div><div><dt className="text-xs text-muted-foreground">Beban Studi</dt><dd className="mt-1 font-medium">{submission.courses.length} mata kuliah · {credits} SKS</dd></div></dl></CardContent></Card>
    </div>

    {hasWarning && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"><div className="flex gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0" /><div><p className="font-medium">Perlu perhatian sebelum diproses</p><ul className="mt-2 list-disc space-y-1 pl-4 text-sm">{submission.validation.scheduleConflict && <li>Validasi dummy menandai adanya bentrok jadwal.</li>}{submission.validation.exceedsCreditLimit && <li>Validasi dummy menandai total SKS melebihi batas mahasiswa.</li>}</ul></div></div></div>}

    {submission.status === "REJECTED" && submission.rejectionReason && <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30"><p className="text-sm font-medium text-red-800 dark:text-red-200">Alasan penolakan</p><p className="mt-1 text-sm text-red-700 dark:text-red-300">{submission.rejectionReason}</p></div>}

    <Card><CardHeader><CardTitle className="text-base">Mata Kuliah Dipilih</CardTitle><p className="text-sm text-muted-foreground">Daftar ini bersifat read-only.</p></CardHeader><CardContent>
      <div className="hidden overflow-hidden rounded-xl border md:block"><Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Mata Kuliah</TableHead><TableHead>SKS</TableHead><TableHead>Kelas</TableHead><TableHead>Jadwal</TableHead><TableHead>Dosen</TableHead></TableRow></TableHeader><TableBody>{submission.courses.map((course) => <TableRow key={course.code}><TableCell className="font-medium">{course.code}</TableCell><TableCell>{course.name}</TableCell><TableCell>{course.credits}</TableCell><TableCell>{course.className}</TableCell><TableCell>{course.schedule}</TableCell><TableCell>{course.lecturer}</TableCell></TableRow>)}</TableBody></Table></div>
      <div className="grid gap-3 md:hidden">{submission.courses.map((course) => <div key={course.code} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{course.name}</p><p className="mt-1 text-xs text-muted-foreground">{course.code} · {course.className}</p></div><Badge variant="secondary">{course.credits} SKS</Badge></div><dl className="mt-3 space-y-2 text-sm"><div><dt className="text-xs text-muted-foreground">Jadwal</dt><dd>{course.schedule}</dd></div><div><dt className="text-xs text-muted-foreground">Dosen</dt><dd>{course.lecturer}</dd></div></dl></div>)}</div>
    </CardContent></Card>

    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">{submission.status === "PENDING" ? <><Button variant="outline" onClick={onReject}><XCircle /> Tolak KRS</Button><Button onClick={onApprove}><CheckCircle2 /> Setujui KRS</Button></> : <p className="text-sm text-muted-foreground">Pengajuan telah diproses dan sekarang bersifat read-only.</p>}</div>
  </div>
}

export default function DosenPersetujuanKRSPage() {
  const [submissions, setSubmissions] = useState(initialSubmissions)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<StatusTab>("PENDING")
  const [search, setSearch] = useState("")
  const [program, setProgram] = useState("ALL")
  const [cohort, setCohort] = useState("ALL")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectionError, setRejectionError] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 350)
    return () => window.clearTimeout(timer)
  }, [])

  const selected = submissions.find((item) => item.id === selectedId) ?? null
  const counts = useMemo(() => ({
    pending: submissions.filter((item) => item.status === "PENDING").length,
    approved: submissions.filter((item) => item.status === "APPROVED").length,
    rejected: submissions.filter((item) => item.status === "REJECTED").length,
  }), [submissions])

  const filtered = useMemo(() => submissions.filter((item) => {
    const query = search.trim().toLowerCase()
    return (!query || item.name.toLowerCase().includes(query) || item.nim.includes(query))
      && (activeTab === "ALL" || item.status === activeTab)
      && (program === "ALL" || item.program === program)
      && (cohort === "ALL" || String(item.cohort) === cohort)
      && (statusFilter === "ALL" || item.status === statusFilter)
  }), [activeTab, cohort, program, search, statusFilter, submissions])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const resetPage = () => setPage(1)
  const openDetail = (item: KrsSubmission) => { setSelectedId(item.id); window.scrollTo({ top: 0, behavior: "smooth" }) }

  const updateStatus = (status: KrsStatus, reason?: string) => {
    if (!selected || selected.status !== "PENDING") {
      toast.error("KRS ini sudah diproses dan tidak dapat diubah.")
      return
    }
    setSubmissions((current) => current.map((item) => item.id === selected.id ? { ...item, status, rejectionReason: reason } : item))
    toast.success(status === "APPROVED" ? "KRS berhasil disetujui." : "KRS berhasil ditolak.")
  }

  const confirmReject = () => {
    const reason = rejectionReason.trim()
    if (!reason) {
      setRejectionError("Alasan penolakan wajib diisi.")
      toast.error("Lengkapi alasan penolakan terlebih dahulu.")
      return
    }
    updateStatus("REJECTED", reason)
    setRejectOpen(false)
    setRejectionReason("")
    setRejectionError("")
  }

  if (selected) return <>
    <ReviewDetail submission={selected} onBack={() => setSelectedId(null)} onApprove={() => setApproveOpen(true)} onReject={() => { setRejectionReason(""); setRejectionError(""); setRejectOpen(true) }} />
    <Dialog open={approveOpen} onOpenChange={setApproveOpen}><DialogContent><DialogHeader><DialogTitle>Setujui KRS mahasiswa?</DialogTitle><DialogDescription>Pastikan mata kuliah, jadwal, dan total SKS telah ditinjau. Tindakan ini mengubah status dummy menjadi Disetujui.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setApproveOpen(false)}>Batal</Button><Button onClick={() => { updateStatus("APPROVED"); setApproveOpen(false) }}><CheckCircle2 /> Ya, Setujui</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={rejectOpen} onOpenChange={(open) => { setRejectOpen(open); if (!open) setRejectionError("") }}><DialogContent><DialogHeader><DialogTitle>Tolak KRS mahasiswa?</DialogTitle><DialogDescription>Alasan akan ditampilkan pada detail KRS dan wajib diisi.</DialogDescription></DialogHeader><div><label htmlFor="rejection-reason" className="text-sm font-medium">Alasan penolakan</label><Textarea id="rejection-reason" className="mt-2 min-h-28" value={rejectionReason} onChange={(event) => { setRejectionReason(event.target.value); if (event.target.value.trim()) setRejectionError("") }} placeholder="Tuliskan alasan yang jelas dan dapat ditindaklanjuti" aria-invalid={Boolean(rejectionError)} />{rejectionError && <p className="mt-2 text-sm text-destructive">{rejectionError}</p>}</div><DialogFooter><Button variant="outline" onClick={() => setRejectOpen(false)}>Batal</Button><Button variant="destructive" onClick={confirmReject}><XCircle /> Tolak KRS</Button></DialogFooter></DialogContent></Dialog>
  </>

  return <div className="space-y-5">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Persetujuan KRS</h1><Badge variant="secondary"><Database /> Data Dummy</Badge></div><p className="mt-1 text-sm text-muted-foreground">Tinjau KRS mahasiswa yang menjadi bimbingan akademik Anda.</p></div><div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm"><CalendarDays className="size-4 text-primary" /><div><p className="text-[11px] text-muted-foreground">Tahun Akademik Aktif</p><p className="font-medium">{activeAcademicYear}</p></div></div></header>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><SummaryCard label="Menunggu Persetujuan" value={counts.pending} icon={ClipboardCheck} tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" /><SummaryCard label="Disetujui" value={counts.approved} icon={CheckCircle2} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" /><div className="col-span-2 lg:col-span-1"><SummaryCard label="Ditolak" value={counts.rejected} icon={XCircle} tone="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" /></div></div>

    <Card><CardHeader><CardTitle className="text-base">Daftar Pengajuan KRS</CardTitle><p className="text-sm text-muted-foreground">Hanya menampilkan pengajuan mahasiswa PA Anda.</p></CardHeader><CardContent className="space-y-4">
      <div className="overflow-x-auto" role="tablist" aria-label="Status pengajuan KRS"><div className="inline-flex min-w-full gap-1 rounded-xl bg-muted p-1 sm:min-w-0">{tabOptions.map((tab) => <button key={tab.value} type="button" role="tab" aria-selected={activeTab === tab.value} onClick={() => { setActiveTab(tab.value); setStatusFilter("ALL"); resetPage() }} className={cn("min-w-max flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeTab === tab.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{tab.label}</button>)}</div></div>
      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_190px_170px_180px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} className="pl-9" placeholder="Cari NIM atau nama mahasiswa" /></div><Select value={program} onValueChange={(value) => { if (value) { setProgram(value); resetPage() } }}><SelectTrigger className="w-full"><SelectValue placeholder="Program Studi" /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Program Studi</SelectItem><SelectItem value="Informatika">Informatika</SelectItem><SelectItem value="Sistem Informasi">Sistem Informasi</SelectItem></SelectContent></Select><Select value={cohort} onValueChange={(value) => { if (value) { setCohort(value); resetPage() } }}><SelectTrigger className="w-full"><SelectValue placeholder="Angkatan" /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Angkatan</SelectItem><SelectItem value="2023">2023</SelectItem><SelectItem value="2024">2024</SelectItem><SelectItem value="2025">2025</SelectItem></SelectContent></Select><Select value={statusFilter} onValueChange={(value) => { if (value) { setStatusFilter(value); resetPage() } }}><SelectTrigger className="w-full"><SelectValue placeholder="Status KRS" /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Status KRS</SelectItem><SelectItem value="PENDING">Menunggu</SelectItem><SelectItem value="APPROVED">Disetujui</SelectItem><SelectItem value="REJECTED">Ditolak</SelectItem></SelectContent></Select></div>

      {isLoading ? <LoadingList /> : visible.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"><FileSearch className="size-10 text-muted-foreground/60" /><h2 className="mt-3 font-medium">Pengajuan KRS tidak ditemukan</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Coba ubah tab, pencarian, atau filter yang digunakan.</p></div> : <>
        <div className="hidden overflow-hidden rounded-xl border md:block"><Table><TableHeader><TableRow><TableHead>NIM</TableHead><TableHead>Nama Mahasiswa</TableHead><TableHead>Prodi</TableHead><TableHead>Semester</TableHead><TableHead>Total SKS</TableHead><TableHead>Tanggal Pengajuan</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{visible.map((item) => <TableRow key={item.id}><TableCell className="font-medium">{item.nim}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.program}</TableCell><TableCell>{item.semester}</TableCell><TableCell>{totalCredits(item)}</TableCell><TableCell>{item.submittedAt}</TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openDetail(item)}>{item.status === "PENDING" ? "Review KRS" : "Lihat Detail"} <ChevronRight /></Button></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="grid gap-3 md:hidden">{visible.map((item) => <Card key={item.id} className="gap-4 py-4"><CardContent className="space-y-4 px-4"><div className="flex items-start gap-3"><Avatar><AvatarFallback className="bg-primary/10 text-primary">{initials(item.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.nim}</p></div><StatusBadge status={item.status} /></div><dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm"><div><dt className="text-xs text-muted-foreground">Prodi</dt><dd className="mt-1 font-medium">{item.program}</dd></div><div><dt className="text-xs text-muted-foreground">Semester</dt><dd className="mt-1 font-medium">{item.semester}</dd></div><div><dt className="text-xs text-muted-foreground">Total SKS</dt><dd className="mt-1 font-medium">{totalCredits(item)} SKS</dd></div><div><dt className="text-xs text-muted-foreground">Diajukan</dt><dd className="mt-1 font-medium">{item.submittedAt}</dd></div></dl><Button className="w-full" variant="outline" onClick={() => openDetail(item)}>{item.status === "PENDING" ? "Review KRS" : "Lihat Detail"} <ChevronRight /></Button></CardContent></Card>)}</div>
      </>}

      {!isLoading && filtered.length > 0 && <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length} pengajuan</p><div className="flex items-center justify-between gap-2 sm:justify-end"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft /> Sebelumnya</Button><span className="min-w-16 text-center text-xs text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Berikutnya <ChevronRight /></Button></div></div>}
    </CardContent></Card>
  </div>
}
