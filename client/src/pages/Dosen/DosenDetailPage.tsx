import { LecturerDataTabs } from "./lecturer-detail-tabs"
import { AccountTab } from "./lecturer-account-tab"
import { useEffect, useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Activity, Ban, EllipsisVertical, KeyRound, ArrowLeft, BookOpen, CalendarDays, GraduationCap, Loader2, Mail, Pencil, Users, UserRound, RefreshCw } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getLecturerById } from "@/features/action/dosenThunk"
import type { LecturerDetailResponse } from "@/types/lecturer-detail"

const sections = ["Informasi Pribadi", "Akademik", "Mengajar", "Mahasiswa PA", "Jadwal", "Akun"] as const
type Section = (typeof sections)[number]

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1 border-b border-border/60 pb-3 last:border-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{children || "—"}</dd></div>
}

function formatBirthDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date)
}

export default function DosenDetailPage() {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { lecturerDetail, isLoadingLecturerDetail, lecturerDetailError } = useAppSelector((state) => state.lecturers)

  useEffect(() => {
    if (!id) return
    const request = dispatch(getLecturerById(id))
    return () => request.abort()
  }, [dispatch, id])

  const goBack = () => {
    if (typeof window.history.state?.idx === "number" && window.history.state.idx > 0) navigate(-1)
    else navigate("/dosen", { replace: true })
  }

  if (!id || (!isLoadingLecturerDetail && lecturerDetailError)) {
    return <main className="mx-auto w-full max-w-6xl space-y-5 py-5 sm:py-7"><Button variant="ghost" onClick={goBack}><ArrowLeft /> Kembali</Button><Card><CardContent className="space-y-4 py-10 text-center"><h1 className="text-xl font-semibold">Detail dosen tidak dapat dimuat</h1><p role="alert" className="text-sm text-muted-foreground">{id ? lecturerDetailError : "ID dosen tidak tersedia."}</p>{id && <Button variant="outline" onClick={() => dispatch(getLecturerById(id))}><RefreshCw /> Coba Lagi</Button>}</CardContent></Card></main>
  }

  if (isLoadingLecturerDetail || !lecturerDetail || lecturerDetail.id !== id) {
    return <main aria-busy="true" aria-label="Memuat detail dosen" className="mx-auto w-full max-w-6xl space-y-5 py-5 sm:py-7"><Button variant="ghost" onClick={goBack}><ArrowLeft /> Kembali</Button><p className="sr-only" role="status">Memuat detail dosen...</p><Skeleton className="h-56 w-full rounded-xl" /><div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}</div><Skeleton className="h-80 w-full rounded-xl" /></main>
  }

  return <LecturerDetailContent key={lecturerDetail.id} lecturer={lecturerDetail} goBack={goBack} />
}

function LecturerDetailContent({ lecturer, goBack }: { lecturer: LecturerDetailResponse["lecturer"]; goBack: () => void }) {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<Section>("Informasi Pribadi")
  const initials = lecturer.nama.trim().split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "D"
  const [settledAvatarUrl, setSettledAvatarUrl] = useState<string | null>(null)
  const avatarLoading = Boolean(lecturer.avatarUrl && settledAvatarUrl !== lecturer.avatarUrl)
  const summary = lecturer.summary

  return <main className="mx-auto w-full max-w-6xl space-y-5 py-5 sm:py-7">
    <div className="flex items-center justify-between gap-3"><Button variant="ghost" className="-ml-2 text-muted-foreground" onClick={goBack}><ArrowLeft /> Kembali</Button><Badge variant="outline">Detail Dosen</Badge></div>
    <section aria-label="Profil dosen" className="relative overflow-hidden rounded-xl bg-primary px-5 py-6 text-primary-foreground sm:px-8 sm:py-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full border-32 border-primary-foreground/10" />
      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-4 sm:items-center sm:gap-5">
          <Avatar aria-busy={avatarLoading} className="size-16 shrink-0 border-2 border-primary-foreground/20 sm:size-20">
            <AvatarImage key={lecturer.avatarUrl} src={lecturer.avatarUrl ?? undefined} alt={`Foto ${lecturer.nama}`} onLoadingStatusChange={(status) => { if (status === "loaded" || status === "error") setSettledAvatarUrl(lecturer.avatarUrl) }} />
            <AvatarFallback className="bg-primary-foreground/15 text-xl text-primary-foreground">{initials}</AvatarFallback>
            {avatarLoading && <span role="status" className="absolute inset-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground"><Loader2 aria-hidden="true" className="size-6 animate-spin" /><span className="sr-only">Memuat foto profil dosen...</span></span>}
          </Avatar>
          <div className="min-w-0"><p className="mb-1 text-xs font-medium uppercase tracking-widest text-primary-foreground/70">Profil Dosen</p><h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{lecturer.nama}</h1><p className="mt-2 text-sm text-primary-foreground/80">NIDN {lecturer.nidn ?? "—"}</p><p className="mt-1 text-sm text-primary-foreground/80">{lecturer.prodi?.nama ?? "Program studi belum tersedia"} · {lecturer.fakultas?.nama ?? "Fakultas belum tersedia"}</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          <Button variant="secondary" size="sm" onClick={() => navigate(`/dosen/${lecturer.id}/edit`)}><Pencil /> Edit Dosen</Button>
          <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Buka menu aksi dosen" className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><EllipsisVertical /></Button>} /><DropdownMenuContent align="end" className="w-56"><p className="px-2 py-2 text-xs text-muted-foreground">Aksi tersedia sebagai simulasi di tab Akun.</p><DropdownMenuItem disabled><UserRound /> Ubah Status</DropdownMenuItem><DropdownMenuItem onClick={() => setActiveSection("Akun")}><KeyRound /> Reset Password</DropdownMenuItem><DropdownMenuItem disabled><Activity /> Lihat Aktivitas</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => setActiveSection("Akun")}><Ban /> Nonaktifkan Akun</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </div>
      {lecturer.email && <div className="relative mt-6 flex items-center gap-2 break-all border-t border-primary-foreground/15 pt-4 text-xs text-primary-foreground/80"><Mail className="size-3.5 shrink-0" />{lecturer.email}</div>}
    </section>

    <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Ringkasan aktivitas</h2><p className="text-xs text-muted-foreground">Pengajaran pada tahun akademik aktif</p></div>
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {[{ label: "Mata kuliah diampu", value: summary.mataKuliahDiampu, detail: "Mata kuliah berbeda", icon: BookOpen }, { label: "Kelas aktif", value: summary.kelasAktif, detail: "Tahun akademik aktif", icon: GraduationCap }, { label: "Mahasiswa bimbingan", value: summary.mahasiswaBimbingan, detail: "Total mahasiswa terdaftar", icon: Users }, { label: "Jadwal mingguan", value: summary.jadwalMingguan, detail: "Tahun akademik aktif", icon: CalendarDays }].map(({ label, value, detail, icon: Icon }) => <Card key={label}><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><p className="text-xs text-muted-foreground">{label}</p><Icon className="size-4 shrink-0 text-primary" /></div><p className="mt-3 text-2xl font-semibold tracking-tight">{value ?? "—"}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></Card>)}
    </div>

    <section className="min-w-0 overflow-hidden rounded-xl border bg-card">
      <nav className="flex overflow-x-auto border-b px-2 sm:px-4" aria-label="Bagian detail dosen">{sections.map((section) => <button type="button" key={section} onClick={() => setActiveSection(section)} aria-current={activeSection === section ? "page" : undefined} className={`relative shrink-0 px-3 py-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring sm:px-4 ${activeSection === section ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>{section}{activeSection === section && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-primary" />}</button>)}</nav>
      <div className="space-y-5 p-4 sm:p-6">
        {activeSection === "Informasi Pribadi" && <div className="grid items-start gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-4 text-muted-foreground" /> Data Identitas</CardTitle></CardHeader><CardContent><dl className="grid gap-4 sm:grid-cols-2"><InfoRow label="Nama lengkap">{lecturer.nama}</InfoRow><InfoRow label="NIDN">{lecturer.nidn}</InfoRow><InfoRow label="Jenis kelamin">{lecturer.jenisKelamin}</InfoRow><InfoRow label="Tempat lahir">{lecturer.tempatLahir}</InfoRow><InfoRow label="Tanggal lahir">{formatBirthDate(lecturer.tanggalLahir)}</InfoRow></dl></CardContent></Card><Card><CardHeader><CardTitle>Informasi Kontak</CardTitle></CardHeader><CardContent><dl className="grid gap-4"><InfoRow label="Email">{lecturer.email}</InfoRow><InfoRow label="Nomor telepon">{lecturer.noHp}</InfoRow><InfoRow label="Alamat">{lecturer.alamat}</InfoRow></dl></CardContent></Card></div>}
        {activeSection === "Akademik" && <div><Card><CardHeader><CardTitle>Penempatan Akademik</CardTitle></CardHeader><CardContent><dl className="grid gap-4"><InfoRow label="Fakultas">{lecturer.fakultas?.nama}</InfoRow><InfoRow label="Program studi">{lecturer.prodi?.nama}</InfoRow><InfoRow label="NIDN">{lecturer.nidn}</InfoRow><InfoRow label="Pendidikan terakhir">{lecturer.pendidikanTerakhir}</InfoRow><InfoRow label="Bidang keahlian">{lecturer.bidangKeahlian}</InfoRow></dl></CardContent></Card></div>}
        {(activeSection === "Mengajar" || activeSection === "Jadwal" || activeSection === "Mahasiswa PA") && <LecturerDataTabs id={lecturer.id} section={activeSection} />}
        <div hidden={activeSection !== "Akun"}><AccountTab email={lecturer.email} name={lecturer.nama} /></div>
      </div>
    </section>
  </main>
}
