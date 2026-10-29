import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpenCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Database,
  GraduationCap,
  Search,
  UserCheck,
  UsersRound,
} from "lucide-react"
import { Link } from "react-router"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

type StudentStatus = "Aktif" | "Cuti"
type DetailTab = "profile" | "krs" | "grades" | "attendance"

type Advisee = {
  nim: string
  name: string
  email: string
  phone: string
  program: string
  faculty: string
  cohort: number
  semester: number
  gpa: number
  lastGpa: number
  totalCredits: number
  attendance: number
  status: StudentStatus
  krsPending: boolean
  birth: string
  address: string
}

const activeAcademicYear = "2026/2027 Ganjil"
const pageSize = 5

const advisees: Advisee[] = [
  { nim: "231011001", name: "Alya Putri Ramadhani", email: "alya.ramadhani@mahasiswa.ac.id", phone: "0812 3456 7801", program: "Informatika", faculty: "Fakultas Teknik", cohort: 2023, semester: 7, gpa: 3.82, lastGpa: 3.91, totalCredits: 118, attendance: 96, status: "Aktif", krsPending: true, birth: "Bandung, 14 Februari 2005", address: "Bandung, Jawa Barat" },
  { nim: "231011007", name: "Dimas Arya Pratama", email: "dimas.pratama@mahasiswa.ac.id", phone: "0812 3456 7807", program: "Informatika", faculty: "Fakultas Teknik", cohort: 2023, semester: 7, gpa: 3.48, lastGpa: 3.55, totalCredits: 116, attendance: 92, status: "Aktif", krsPending: false, birth: "Cimahi, 3 Juli 2004", address: "Cimahi, Jawa Barat" },
  { nim: "231011014", name: "Nabila Rahmawati", email: "nabila.rahmawati@mahasiswa.ac.id", phone: "0812 3456 7814", program: "Informatika", faculty: "Fakultas Teknik", cohort: 2023, semester: 7, gpa: 3.71, lastGpa: 3.76, totalCredits: 120, attendance: 95, status: "Aktif", krsPending: true, birth: "Garut, 21 November 2004", address: "Garut, Jawa Barat" },
  { nim: "231011021", name: "Rizky Maulana", email: "rizky.maulana@mahasiswa.ac.id", phone: "0812 3456 7821", program: "Informatika", faculty: "Fakultas Teknik", cohort: 2023, semester: 7, gpa: 3.12, lastGpa: 3.06, totalCredits: 102, attendance: 84, status: "Cuti", krsPending: false, birth: "Sumedang, 9 Januari 2005", address: "Sumedang, Jawa Barat" },
  { nim: "241011005", name: "Salsabila Nur Azizah", email: "salsabila.azizah@mahasiswa.ac.id", phone: "0812 3456 7905", program: "Informatika", faculty: "Fakultas Teknik", cohort: 2024, semester: 5, gpa: 3.65, lastGpa: 3.72, totalCredits: 78, attendance: 94, status: "Aktif", krsPending: true, birth: "Tasikmalaya, 30 Mei 2006", address: "Tasikmalaya, Jawa Barat" },
  { nim: "241011012", name: "Fajar Aditya Nugraha", email: "fajar.nugraha@mahasiswa.ac.id", phone: "0812 3456 7912", program: "Informatika", faculty: "Fakultas Teknik", cohort: 2024, semester: 5, gpa: 3.36, lastGpa: 3.41, totalCredits: 76, attendance: 90, status: "Aktif", krsPending: false, birth: "Bogor, 12 April 2006", address: "Bogor, Jawa Barat" },
  { nim: "241021009", name: "Intan Permata Sari", email: "intan.sari@mahasiswa.ac.id", phone: "0812 3456 8009", program: "Sistem Informasi", faculty: "Fakultas Teknik", cohort: 2024, semester: 5, gpa: 3.77, lastGpa: 3.84, totalCredits: 80, attendance: 97, status: "Aktif", krsPending: true, birth: "Bekasi, 18 September 2005", address: "Bekasi, Jawa Barat" },
  { nim: "251021003", name: "Muhammad Farhan", email: "farhan@mahasiswa.ac.id", phone: "0812 3456 8103", program: "Sistem Informasi", faculty: "Fakultas Teknik", cohort: 2025, semester: 3, gpa: 3.44, lastGpa: 3.51, totalCredits: 42, attendance: 91, status: "Aktif", krsPending: true, birth: "Depok, 7 Maret 2007", address: "Depok, Jawa Barat" },
  { nim: "251011016", name: "Citra Ayu Lestari", email: "citra.lestari@mahasiswa.ac.id", phone: "0812 3456 8116", program: "Informatika", faculty: "Fakultas Teknik", cohort: 2025, semester: 3, gpa: 3.58, lastGpa: 3.63, totalCredits: 44, attendance: 93, status: "Aktif", krsPending: false, birth: "Cianjur, 25 Agustus 2006", address: "Cianjur, Jawa Barat" },
]

const tabs: Array<{ id: DetailTab; label: string }> = [
  { id: "profile", label: "Profil" },
  { id: "krs", label: "KRS" },
  { id: "grades", label: "Nilai" },
  { id: "attendance", label: "Presensi" },
]

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((part) => part[0]).join("")
}

function StatusBadge({ status }: { status: StudentStatus }) {
  return <Badge className={cn(status === "Aktif" ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300")} variant="outline">{status}</Badge>
}

function SummaryCard({ label, value, note, icon: Icon }: { label: string; value: number | string; note: string; icon: typeof UsersRound }) {
  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex items-start justify-between gap-3 px-4">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>
        <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
      </CardContent>
    </Card>
  )
}

function LoadingList() {
  return <div className="space-y-3" aria-label="Memuat mahasiswa"><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
}

function DetailPanel({ student, activeTab, onTabChange, onBack }: { student: Advisee; activeTab: DetailTab; onTabChange: (tab: DetailTab) => void; onBack: () => void }) {
  const semesterGrades = [
    { semester: "2025/2026 Genap", ips: student.lastGpa, credits: student.semester <= 3 ? 22 : 20 },
    { semester: "2025/2026 Ganjil", ips: Math.max(2.75, student.lastGpa - 0.12), credits: 20 },
    { semester: "2024/2025 Genap", ips: Math.max(2.75, student.gpa - 0.08), credits: 21 },
  ]
  const courses = [
    { name: "Rekayasa Perangkat Lunak", attendance: Math.min(100, student.attendance + 2), grade: "A" },
    { name: "Basis Data", attendance: student.attendance, grade: student.gpa >= 3.5 ? "A" : "B+" },
    { name: "Manajemen Proyek TI", attendance: Math.max(75, student.attendance - 4), grade: "B+" },
  ]

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={onBack}><ArrowLeft /> Kembali ke daftar</Button>
      <Card className="overflow-hidden py-0">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="size-16 text-lg sm:size-20"><AvatarFallback className="bg-primary/10 font-semibold text-primary">{initials(student.name)}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-semibold sm:text-2xl">{student.name}</h1><StatusBadge status={student.status} /></div><p className="mt-1 text-sm text-muted-foreground">{student.nim} · {student.program}</p><p className="mt-1 text-xs text-muted-foreground">Angkatan {student.cohort} · Semester {student.semester}</p></div>
            <Badge variant="secondary" className="w-fit"><Database /> Data Dummy</Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="IPK" value={student.gpa.toFixed(2)} note="Kumulatif" icon={GraduationCap} />
        <SummaryCard label="IPS Terakhir" value={student.lastGpa.toFixed(2)} note="Semester sebelumnya" icon={BookOpenCheck} />
        <SummaryCard label="Total SKS" value={student.totalCredits} note="Telah ditempuh" icon={ClipboardCheck} />
        <SummaryCard label="Kehadiran" value={`${student.attendance}%`} note="Rata-rata semester" icon={UserCheck} />
      </div>

      <Card>
        <CardHeader className="pb-0">
          <div className="overflow-x-auto" role="tablist" aria-label="Detail mahasiswa PA"><div className="inline-flex min-w-full gap-1 rounded-xl bg-muted p-1 sm:min-w-0">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => onTabChange(tab.id)} className={cn("min-w-max flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{tab.label}</button>)}</div></div>
        </CardHeader>
        <CardContent role="tabpanel" className="pt-5">
          {activeTab === "profile" && <div className="grid gap-5 md:grid-cols-2"><section><h2 className="font-medium">Identitas</h2><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-xs text-muted-foreground">Nama lengkap</dt><dd className="mt-1 font-medium">{student.name}</dd></div><div><dt className="text-xs text-muted-foreground">Tempat, tanggal lahir</dt><dd className="mt-1 font-medium">{student.birth}</dd></div><div><dt className="text-xs text-muted-foreground">Email</dt><dd className="mt-1 font-medium">{student.email}</dd></div><div><dt className="text-xs text-muted-foreground">Telepon</dt><dd className="mt-1 font-medium">{student.phone}</dd></div><div><dt className="text-xs text-muted-foreground">Domisili</dt><dd className="mt-1 font-medium">{student.address}</dd></div></dl></section><section><h2 className="font-medium">Informasi Akademik</h2><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-xs text-muted-foreground">NIM</dt><dd className="mt-1 font-medium">{student.nim}</dd></div><div><dt className="text-xs text-muted-foreground">Fakultas / Program Studi</dt><dd className="mt-1 font-medium">{student.faculty} · {student.program}</dd></div><div><dt className="text-xs text-muted-foreground">Angkatan / Semester</dt><dd className="mt-1 font-medium">{student.cohort} · Semester {student.semester}</dd></div><div><dt className="text-xs text-muted-foreground">Status</dt><dd className="mt-1"><StatusBadge status={student.status} /></dd></div></dl></section></div>}

          {activeTab === "krs" && <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-medium">Riwayat KRS</h2><p className="mt-1 text-sm text-muted-foreground">Informasi KRS bersifat read-only. Persetujuan dilakukan pada halaman Persetujuan KRS.</p></div>{student.krsPending && <Button nativeButton={false} render={<Link to="/dosen/persetujuan-krs" />}>Buka Persetujuan KRS <ChevronRight /></Button>}</div><div className="grid gap-3">{semesterGrades.map((item, index) => <div key={item.semester} className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{item.semester}</p><p className="mt-1 text-xs text-muted-foreground">{item.credits} SKS diambil</p></div><Badge variant={index === 0 && student.krsPending ? "outline" : "secondary"}>{index === 0 && student.krsPending ? "Menunggu Persetujuan" : "Disetujui"}</Badge></div>)}</div></div>}

          {activeTab === "grades" && <div className="space-y-4"><div><h2 className="font-medium">Ringkasan Nilai</h2><p className="mt-1 text-sm text-muted-foreground">Perkembangan IPS dan IPK mahasiswa per semester.</p></div><div className="grid gap-3 sm:grid-cols-3">{semesterGrades.map((item) => <div key={item.semester} className="rounded-xl border border-border/70 p-4"><p className="text-xs text-muted-foreground">{item.semester}</p><p className="mt-2 text-2xl font-semibold">{item.ips.toFixed(2)}</p><p className="text-xs text-muted-foreground">IPS · {item.credits} SKS</p></div>)}</div><div className="space-y-2"><h3 className="text-sm font-medium">Nilai Semester Terkini</h3>{courses.map((course) => <div key={course.name} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3 text-sm"><span>{course.name}</span><Badge variant="secondary">{course.grade}</Badge></div>)}</div></div>}

          {activeTab === "attendance" && <div className="space-y-4"><div><h2 className="font-medium">Ringkasan Presensi</h2><p className="mt-1 text-sm text-muted-foreground">Kehadiran mahasiswa pada semester aktif.</p></div><div className="space-y-3">{courses.map((course) => <div key={course.name} className="rounded-xl border border-border/70 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{course.name}</p><span className="text-sm font-semibold">{course.attendance}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${course.attendance}%` }} /></div></div>)}</div></div>}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DosenMahasiswaPAPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [cohort, setCohort] = useState("ALL")
  const [program, setProgram] = useState("ALL")
  const [status, setStatus] = useState("ALL")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Advisee | null>(null)
  const [activeTab, setActiveTab] = useState<DetailTab>("profile")

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 350)
    return () => window.clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => advisees.filter((student) => {
    const query = search.trim().toLowerCase()
    return (!query || student.name.toLowerCase().includes(query) || student.nim.toLowerCase().includes(query))
      && (cohort === "ALL" || String(student.cohort) === cohort)
      && (program === "ALL" || student.program === program)
      && (status === "ALL" || student.status === status)
  }), [cohort, program, search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const openDetail = (student: Advisee) => { setSelected(student); setActiveTab("profile"); window.scrollTo({ top: 0, behavior: "smooth" }) }

  if (selected) return <DetailPanel student={selected} activeTab={activeTab} onTabChange={setActiveTab} onBack={() => setSelected(null)} />

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mahasiswa Pembimbing Akademik</h1><Badge variant="secondary"><Database /> Data Dummy</Badge></div><p className="mt-1 text-sm text-muted-foreground">Pantau perkembangan akademik mahasiswa yang menjadi bimbingan Anda.</p></div><div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm"><CalendarDays className="size-4 text-primary" /><div><p className="text-[11px] text-muted-foreground">Tahun Akademik Aktif</p><p className="font-medium">{activeAcademicYear}</p></div></div></header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><SummaryCard label="Total Mahasiswa PA" value={advisees.length} note="Mahasiswa bimbingan" icon={UsersRound} /><SummaryCard label="Mahasiswa Aktif" value={advisees.filter((item) => item.status === "Aktif").length} note="Status akademik aktif" icon={UserCheck} /><div className="col-span-2 lg:col-span-1"><SummaryCard label="KRS Menunggu Persetujuan" value={advisees.filter((item) => item.krsPending).length} note="Perlu ditinjau" icon={ClipboardCheck} /></div></div>

      <Card>
        <CardHeader><CardTitle className="text-base">Daftar Mahasiswa PA</CardTitle><p className="text-sm text-muted-foreground">Hanya menampilkan mahasiswa yang menjadi bimbingan akademik Anda.</p></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_170px_190px_170px]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} className="pl-9" placeholder="Cari NIM atau nama mahasiswa" aria-label="Cari mahasiswa" /></div><Select value={cohort} onValueChange={(value) => { if (value) { setCohort(value); setPage(1) } }}><SelectTrigger className="w-full"><SelectValue placeholder="Angkatan" /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Angkatan</SelectItem><SelectItem value="2023">2023</SelectItem><SelectItem value="2024">2024</SelectItem><SelectItem value="2025">2025</SelectItem></SelectContent></Select><Select value={program} onValueChange={(value) => { if (value) { setProgram(value); setPage(1) } }}><SelectTrigger className="w-full"><SelectValue placeholder="Program Studi" /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Program Studi</SelectItem><SelectItem value="Informatika">Informatika</SelectItem><SelectItem value="Sistem Informasi">Sistem Informasi</SelectItem></SelectContent></Select><Select value={status} onValueChange={(value) => { if (value) { setStatus(value); setPage(1) } }}><SelectTrigger className="w-full"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="ALL">Semua Status</SelectItem><SelectItem value="Aktif">Aktif</SelectItem><SelectItem value="Cuti">Cuti</SelectItem></SelectContent></Select></div>

          {isLoading ? <LoadingList /> : visible.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center"><UsersRound className="size-10 text-muted-foreground/60" /><h2 className="mt-3 font-medium">Mahasiswa tidak ditemukan</h2><p className="mt-1 max-w-md text-sm text-muted-foreground">Coba ubah kata pencarian atau filter untuk melihat mahasiswa lainnya.</p></div> : <>
            <div className="hidden overflow-hidden rounded-xl border md:block"><Table><TableHeader><TableRow><TableHead>NIM</TableHead><TableHead>Nama</TableHead><TableHead>Prodi</TableHead><TableHead>Angkatan</TableHead><TableHead>Semester</TableHead><TableHead>IPK</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader><TableBody>{visible.map((student) => <TableRow key={student.nim}><TableCell className="font-medium">{student.nim}</TableCell><TableCell><div className="flex items-center gap-2.5"><Avatar><AvatarFallback>{initials(student.name)}</AvatarFallback></Avatar><span className="font-medium">{student.name}</span></div></TableCell><TableCell>{student.program}</TableCell><TableCell>{student.cohort}</TableCell><TableCell>{student.semester}</TableCell><TableCell>{student.gpa.toFixed(2)}</TableCell><TableCell><StatusBadge status={student.status} /></TableCell><TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openDetail(student)}>Lihat Detail <ChevronRight /></Button></TableCell></TableRow>)}</TableBody></Table></div>
            <div className="grid gap-3 md:hidden">{visible.map((student) => <Card key={student.nim} className="gap-4 py-4"><CardContent className="space-y-4 px-4"><div className="flex items-start gap-3"><Avatar className="size-11"><AvatarFallback className="bg-primary/10 text-primary">{initials(student.name)}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate font-medium">{student.name}</p><p className="text-xs text-muted-foreground">{student.nim}</p></div><StatusBadge status={student.status} /></div><dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm"><div><dt className="text-xs text-muted-foreground">Prodi</dt><dd className="mt-1 font-medium">{student.program}</dd></div><div><dt className="text-xs text-muted-foreground">Angkatan</dt><dd className="mt-1 font-medium">{student.cohort}</dd></div><div><dt className="text-xs text-muted-foreground">Semester</dt><dd className="mt-1 font-medium">{student.semester}</dd></div><div><dt className="text-xs text-muted-foreground">IPK</dt><dd className="mt-1 font-medium">{student.gpa.toFixed(2)}</dd></div></dl><Button className="w-full" variant="outline" onClick={() => openDetail(student)}>Lihat Detail <ChevronRight /></Button></CardContent></Card>)}</div>
          </>}

          {!isLoading && filtered.length > 0 && <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Menampilkan {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} dari {filtered.length} mahasiswa</p><div className="flex items-center justify-between gap-2 sm:justify-end"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft /> Sebelumnya</Button><span className="min-w-16 text-center text-xs text-muted-foreground">{page} / {totalPages}</span><Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>Berikutnya <ChevronRight /></Button></div></div>}
        </CardContent>
      </Card>
    </div>
  )
}
