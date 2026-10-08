import { useEffect, useState, type FormEvent } from "react"
import { Link } from "react-router"
import {
  BookOpenCheck,
  FileText,
  GraduationCap,
  IdCard,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { getStudentProfile, studentProfileErrorMessage, updateStudentProfile } from "@/api/student-profile"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { StudentGender, StudentProfileData, StudentProfileUpdate } from "@/types/student-profile"

type ProfileTab = "personal" | "academic" | "account"
type ProfileDraft = {
  email: string
  phoneNumber: string
  address: string
  birthPlace: string
  birthDate: string
  gender: StudentGender | ""
}
type ProfileErrors = Partial<Record<keyof ProfileDraft, string>>

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "personal", label: "Informasi Pribadi" },
  { id: "academic", label: "Akademik" },
  { id: "account", label: "Akun" },
]

function createDraft(profile: StudentProfileData): ProfileDraft {
  return {
    email: profile.personal.email,
    phoneNumber: profile.personal.phoneNumber ?? "",
    address: profile.personal.address ?? "",
    birthPlace: profile.personal.birthPlace ?? "",
    birthDate: profile.personal.birthDate?.slice(0, 10) ?? "",
    gender: profile.personal.gender ?? "",
  }
}

function emptyValue(value: string | number | null | undefined) {
  return value === null || value === undefined || value === "" ? "Belum tersedia" : String(value)
}

function formatDate(value: string | null) {
  if (!value) return "Belum tersedia"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parsed)
}

function genderLabel(value: StudentGender | null) {
  if (value === "Male") return "Laki-laki"
  if (value === "Female") return "Perempuan"
  return "Belum tersedia"
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase()
}

function validateDraft(draft: ProfileDraft) {
  const errors: ProfileErrors = {}
  if (!/^\S+@\S+\.\S+$/.test(draft.email.trim())) errors.email = "Masukkan alamat email yang valid."
  if (draft.birthDate && draft.birthDate > new Date().toISOString().slice(0, 10)) {
    errors.birthDate = "Tanggal lahir tidak boleh berada di masa depan."
  }
  return errors
}

function InformationItem({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof UserRound }) {
  return (
    <div className="flex min-w-0 gap-3 rounded-xl border bg-card p-4">
      {Icon && <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></span>}
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-1 break-words text-sm font-medium leading-6">{value}</dd>
      </div>
    </div>
  )
}

function PersonalTab({ profile, onEdit }: { profile: StudentProfileData; onEdit: () => void }) {
  const personal = profile.personal
  const items = [
    { label: "Nama Lengkap", value: personal.name, icon: UserRound },
    { label: "NIK", value: emptyValue(personal.nik), icon: IdCard },
    { label: "Jenis Kelamin", value: genderLabel(personal.gender) },
    { label: "Tempat Lahir", value: emptyValue(personal.birthPlace) },
    { label: "Tanggal Lahir", value: formatDate(personal.birthDate) },
    { label: "Email", value: personal.email, icon: Mail },
    { label: "No. HP", value: emptyValue(personal.phoneNumber), icon: Phone },
    { label: "Alamat", value: emptyValue(personal.address), icon: MapPin },
  ]

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="font-semibold">Informasi Pribadi</h2><p className="mt-1 text-sm text-muted-foreground">Nama dan NIK merupakan data resmi. Data lainnya dapat diperbarui sesuai izin akun mahasiswa.</p></div>
          <Button variant="outline" onClick={onEdit}><Pencil /> Edit Informasi</Button>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">{items.map((item) => <InformationItem key={item.label} {...item} />)}</dl>
      </CardContent>
    </Card>
  )
}

function AcademicTab({ profile }: { profile: StudentProfileData }) {
  const academic = profile.academic
  const items = [
    ["NIM", academic.nim],
    ["Fakultas", academic.faculty.name],
    ["Program Studi", academic.studyProgram.name],
    ["Angkatan", String(academic.cohort)],
    ["Semester", String(academic.semester)],
    ["Status Mahasiswa", academic.status],
    ["Dosen PA", academic.academicAdvisor?.name ?? "Belum tersedia"],
    ["Kurikulum", academic.curriculum ? `${academic.curriculum.name} (${academic.curriculum.year})` : "Belum tersedia"],
  ]

  return (
    <div className="space-y-4">
      <Card><CardContent><div><h2 className="font-semibold">Informasi Akademik</h2><p className="mt-1 text-sm text-muted-foreground">Data berikut berasal dari administrasi akademik dan bersifat hanya-baca.</p></div><dl className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <InformationItem key={label} label={label} value={value} />)}</dl></CardContent></Card>
      <section aria-labelledby="academic-shortcuts"><h2 id="academic-shortcuts" className="mb-3 font-semibold">Akses Akademik</h2><div className="grid gap-3 sm:grid-cols-3">
        {[{ label: "KRS", note: "Rencana studi semester", to: "/mahasiswa/krs", icon: BookOpenCheck }, { label: "Nilai & KHS", note: "Hasil studi semester", to: "/mahasiswa/nilai-khs", icon: GraduationCap }, { label: "Transkrip", note: "Riwayat akademik", to: "/mahasiswa/transkrip-nilai", icon: FileText }].map((item) => <Link key={item.label} to={item.to} className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><item.icon className="size-5 text-primary" aria-hidden="true" /><p className="mt-3 text-sm font-semibold group-hover:text-primary">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.note}</p></Link>)}
      </div></section>
    </div>
  )
}

function AccountTab({ profile }: { profile: StudentProfileData }) {
  const items = [["Username", profile.account.username], ["Email login", profile.account.loginEmail], ["Role", profile.account.role]]
  return (
    <Card><CardContent><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-semibold">Informasi Akun</h2><p className="mt-1 text-sm text-muted-foreground">Informasi keamanan akunmu. Password tidak pernah ditampilkan.</p></div><Link to="/mahasiswa/ubah-password" className={buttonVariants({ variant: "outline" })}><KeyRound /> Ubah Password</Link></div><dl className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <InformationItem key={label} label={label} value={value} />)}</dl><div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="text-sm font-medium">Jaga keamanan akun</p><p className="mt-1 text-xs leading-5">Jangan bagikan password atau kode verifikasi kepada siapa pun.</p></div></div></CardContent></Card>
  )
}

function LoadingState() {
  return <div className="space-y-5"><Skeleton className="h-44 w-full rounded-2xl" /><Skeleton className="h-11 w-96 max-w-full rounded-xl" /><Skeleton className="h-80 w-full rounded-2xl" /></div>
}

export default function MahasiswaProfilPage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal")
  const [profile, setProfile] = useState<StudentProfileData | null>(null)
  const [loadError, setLoadError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)
  const [draft, setDraft] = useState<ProfileDraft | null>(null)
  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({})
  const [editOpen, setEditOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const savedDraft = profile ? createDraft(profile) : null
  const draftDirty = Boolean(draft && savedDraft && JSON.stringify(draft) !== JSON.stringify(savedDraft))

  useEffect(() => {
    const controller = new AbortController()
    void getStudentProfile(controller.signal)
      .then(setProfile)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(studentProfileErrorMessage(error, "Profil mahasiswa belum dapat dimuat."))
      })
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => { if (draftDirty) event.preventDefault() }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [draftDirty])

  function openEdit() {
    if (!profile) return
    setDraft(createDraft(profile))
    setProfileErrors({})
    setEditOpen(true)
  }

  function retryLoad() {
    setLoadError("")
    setReloadKey((current) => current + 1)
  }

  function requestCloseEdit() {
    if (draftDirty) setDiscardOpen(true)
    else setEditOpen(false)
  }

  function updateDraft(field: keyof ProfileDraft, value: string) {
    setDraft((current) => current ? { ...current, [field]: value } : current)
    setProfileErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!draft) return
    const errors = validateDraft(draft)
    setProfileErrors(errors)
    if (Object.keys(errors).length) {
      toast.error("Periksa kembali informasi yang belum valid.")
      return
    }

    const input: StudentProfileUpdate = {
      email: draft.email.trim(),
      phoneNumber: draft.phoneNumber.trim() || null,
      address: draft.address.trim() || null,
      birthPlace: draft.birthPlace.trim() || null,
      birthDate: draft.birthDate || null,
      ...(draft.gender ? { gender: draft.gender } : {}),
    }

    setSaving(true)
    try {
      const updated = await updateStudentProfile(input)
      setProfile(updated)
      setDraft(createDraft(updated))
      setEditOpen(false)
      toast.success("Profil berhasil diperbarui.")
    } catch (error) {
      toast.error(studentProfileErrorMessage(error, "Profil belum dapat diperbarui."))
    } finally {
      setSaving(false)
    }
  }

  if (!profile && !loadError) return <main className="mx-auto w-full max-w-6xl py-5 pb-28 sm:py-7 md:pb-7"><LoadingState /></main>

  if (!profile) {
    return <main className="mx-auto w-full max-w-6xl py-5 pb-28 sm:py-7 md:pb-7"><Card><CardContent className="flex min-h-56 flex-col items-center justify-center text-center"><h1 className="text-lg font-semibold">Profil tidak dapat dimuat</h1><p className="mt-2 max-w-md text-sm text-muted-foreground">{loadError}</p><Button className="mt-5" onClick={retryLoad}>Coba Lagi</Button></CardContent></Card></main>
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="flex flex-col items-center gap-5 py-7 text-center md:flex-row md:text-left">
          <div className="relative">
            <Avatar className="size-24 ring-4 ring-background shadow-sm md:size-28"><AvatarImage src={profile.header.avatarUrl ?? undefined} alt={`Foto ${profile.header.name}`} /><AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">{initials(profile.header.name)}</AvatarFallback></Avatar>
            {profile.header.status === "Aktif" && <span className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-background bg-emerald-500" aria-label="Mahasiswa aktif" />}
          </div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-center gap-2 md:justify-start"><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{profile.header.name}</h1><Badge variant="outline" className={cn(profile.header.status === "Aktif" && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300")}>{profile.header.status}</Badge></div><p className="mt-2 text-sm font-medium">NIM {profile.header.nim}</p><p className="mt-1 text-sm text-muted-foreground">{profile.header.studyProgram.name} · {profile.header.faculty.name}</p></div>
        </CardContent>
      </Card>

      {loadError && <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"><p>{loadError} Data terakhir yang berhasil dimuat tetap ditampilkan.</p><Button size="sm" variant="outline" onClick={retryLoad}>Muat Ulang</Button></div>}

      {draftDirty && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"><strong>Perubahan belum disimpan.</strong> Simpan atau batalkan perubahan sebelum meninggalkan halaman.</div>}

      <div className="overflow-x-auto" role="tablist" aria-label="Bagian profil"><div className="inline-flex min-w-full gap-1 rounded-xl bg-muted p-1 sm:min-w-0">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={cn("min-w-max flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{tab.label}</button>)}</div></div>
      <div role="tabpanel">{activeTab === "personal" && <PersonalTab profile={profile} onEdit={openEdit} />}{activeTab === "academic" && <AcademicTab profile={profile} />}{activeTab === "account" && <AccountTab profile={profile} />}</div>

      <Dialog open={editOpen} onOpenChange={(open) => { if (open) setEditOpen(true); else requestCloseEdit() }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Edit Informasi Pribadi</DialogTitle><DialogDescription>Nama dan NIK hanya dapat diubah melalui layanan akademik.</DialogDescription></DialogHeader>{draft && <form onSubmit={saveProfile} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" type="email" maxLength={254} value={draft.email} aria-invalid={!!profileErrors.email} onChange={(event) => updateDraft("email", event.target.value)} />{profileErrors.email && <p role="alert" className="text-xs text-destructive">{profileErrors.email}</p>}</div><div className="space-y-2"><Label htmlFor="profile-phone">No. HP</Label><Input id="profile-phone" inputMode="tel" maxLength={50} value={draft.phoneNumber} onChange={(event) => updateDraft("phoneNumber", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="profile-birth-place">Tempat Lahir</Label><Input id="profile-birth-place" maxLength={255} value={draft.birthPlace} onChange={(event) => updateDraft("birthPlace", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="profile-birth-date">Tanggal Lahir</Label><Input id="profile-birth-date" type="date" max={new Date().toISOString().slice(0, 10)} value={draft.birthDate} aria-invalid={!!profileErrors.birthDate} onChange={(event) => updateDraft("birthDate", event.target.value)} />{profileErrors.birthDate && <p role="alert" className="text-xs text-destructive">{profileErrors.birthDate}</p>}</div><div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-gender">Jenis Kelamin</Label><select id="profile-gender" value={draft.gender} onChange={(event) => updateDraft("gender", event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="" disabled>Pilih jenis kelamin</option><option value="Male">Laki-laki</option><option value="Female">Perempuan</option></select></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-address">Alamat</Label><Textarea id="profile-address" rows={4} maxLength={2000} value={draft.address} onChange={(event) => updateDraft("address", event.target.value)} /></div></div>{draftDirty && <p className="text-xs text-amber-700 dark:text-amber-300">Ada perubahan yang belum disimpan.</p>}<DialogFooter><Button type="button" variant="outline" onClick={requestCloseEdit} disabled={saving}>Batal</Button><Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button></DialogFooter></form>}</DialogContent></Dialog>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Buang perubahan?</DialogTitle><DialogDescription>Perubahan informasi pribadi yang belum disimpan akan hilang.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDiscardOpen(false)}>Lanjut Mengedit</Button><Button variant="destructive" onClick={() => { setDraft(createDraft(profile)); setProfileErrors({}); setDiscardOpen(false); setEditOpen(false) }}>Buang Perubahan</Button></DialogFooter></DialogContent></Dialog>
    </main>
  )
}
