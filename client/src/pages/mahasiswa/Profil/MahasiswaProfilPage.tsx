import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react"
import { Link } from "react-router"
import {
  BookOpenCheck,
  Camera,
  CheckCircle2,
  FileText,
  GraduationCap,
  IdCard,
  KeyRound,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RotateCcw,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { ImageCrop, ImageCropApply, ImageCropContent, ImageCropReset } from "@/components/kibo-ui/image-crop"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { initialStudentContact, studentProfile, type StudentContact } from "./profil-data"

type ProfileTab = "personal" | "academic" | "account"
type ContactErrors = Partial<Record<keyof StudentContact, string>>

const tabs: { id: ProfileTab; label: string }[] = [
  { id: "personal", label: "Informasi Pribadi" },
  { id: "academic", label: "Akademik" },
  { id: "account", label: "Akun" },
]

const initials = studentProfile.fullName.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()

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

function validateContact(contact: StudentContact) {
  const errors: ContactErrors = {}
  if (!/^\S+@\S+\.\S+$/.test(contact.email.trim())) errors.email = "Masukkan alamat email yang valid."
  if (!/^[+\d][\d\s-]{8,17}$/.test(contact.phone.trim())) errors.phone = "Masukkan nomor HP 9–18 karakter berupa angka, spasi, +, atau tanda hubung."
  if (contact.address.trim().length < 10) errors.address = "Alamat minimal 10 karakter."
  return errors
}

function PersonalTab({ contact, onEdit }: { contact: StudentContact; onEdit: () => void }) {
  const items = [
    { label: "Nama Lengkap", value: studentProfile.fullName, icon: UserRound },
    { label: "NIK", value: studentProfile.nik, icon: IdCard },
    { label: "Jenis Kelamin", value: studentProfile.gender },
    { label: "Tempat/Tanggal Lahir", value: `${studentProfile.birthPlace}, ${studentProfile.birthDate}` },
    { label: "Email", value: contact.email, icon: Mail },
    { label: "No. HP", value: contact.phone, icon: Phone },
    { label: "Alamat", value: contact.address, icon: MapPin },
  ]
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div><h2 className="font-semibold">Informasi Pribadi</h2><p className="mt-1 text-sm text-muted-foreground">Data identitas resmi hanya dapat diperbarui melalui layanan akademik.</p></div>
          <Button variant="outline" onClick={onEdit}><Pencil /> Edit Informasi</Button>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">{items.map((item) => <InformationItem key={item.label} {...item} />)}</dl>
      </CardContent>
    </Card>
  )
}

function AcademicTab() {
  const items = [
    ["NIM", studentProfile.nim], ["Fakultas", studentProfile.faculty], ["Program Studi", studentProfile.studyProgram],
    ["Angkatan", studentProfile.enrollmentYear], ["Semester", studentProfile.semester], ["Status Mahasiswa", studentProfile.academicStatus],
    ["Dosen PA", studentProfile.academicAdvisor], ["Kurikulum", studentProfile.curriculum],
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

function AccountTab({ onChangePassword }: { onChangePassword: () => void }) {
  const items = [["Username", studentProfile.username], ["Email login", studentProfile.loginEmail], ["Role", studentProfile.role], ["Status akun", studentProfile.accountStatus], ["Terakhir login", studentProfile.lastLogin]]
  return (
    <Card><CardContent><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="font-semibold">Informasi Akun</h2><p className="mt-1 text-sm text-muted-foreground">Informasi keamanan akunmu. Password tidak pernah ditampilkan.</p></div><Button variant="outline" onClick={onChangePassword}><KeyRound /> Ubah Password</Button></div><dl className="mt-5 grid gap-3 sm:grid-cols-2">{items.map(([label, value]) => <InformationItem key={label} label={label} value={value} />)}</dl><div className="mt-4 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"><ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="text-sm font-medium">Akun terlindungi</p><p className="mt-1 text-xs leading-5">Jangan bagikan password atau kode verifikasi kepada siapa pun.</p></div></div></CardContent></Card>
  )
}

export default function MahasiswaProfilPage() {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal")
  const [contact, setContact] = useState(initialStudentContact)
  const [draft, setDraft] = useState(initialStudentContact)
  const [contactErrors, setContactErrors] = useState<ContactErrors>({})
  const [editOpen, setEditOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photo, setPhoto] = useState<string | null>(studentProfile.avatarUrl)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const draftDirty = JSON.stringify(draft) !== JSON.stringify(contact)
  const hasUnsavedChanges = draftDirty || pendingPhoto !== null

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => { if (hasUnsavedChanges) event.preventDefault() }
    window.addEventListener("beforeunload", warnBeforeUnload)
    return () => window.removeEventListener("beforeunload", warnBeforeUnload)
  }, [hasUnsavedChanges])

  function openEdit() { setDraft(contact); setContactErrors({}); setEditOpen(true) }
  function requestCloseEdit() { if (draftDirty) setDiscardOpen(true); else setEditOpen(false) }
  function saveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateContact(draft)
    setContactErrors(errors)
    if (Object.keys(errors).length) { toast.error("Periksa kembali informasi yang belum valid."); return }
    const normalizedContact = { email: draft.email.trim(), phone: draft.phone.trim(), address: draft.address.trim() }
    setContact(normalizedContact)
    setDraft(normalizedContact)
    setEditOpen(false)
    toast.success("Informasi kontak berhasil diperbarui.")
  }
  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0]
    event.target.value = ""
    if (!selected) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type) || selected.size > 1024 * 1024) { toast.error("Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 1 MB."); return }
    setPhotoFile(selected)
  }
  function applyPhoto() {
    if (!pendingPhoto) return
    setPhoto(pendingPhoto)
    setPendingPhoto(null)
    toast.success("Foto profil berhasil diperbarui.")
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 pb-28 md:pb-7">
      <Card className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardContent className="flex flex-col items-center gap-5 py-7 text-center md:flex-row md:text-left">
          <div className="relative">
            <Avatar className="size-24 ring-4 ring-background shadow-sm md:size-28"><AvatarImage src={pendingPhoto ?? photo ?? undefined} alt={`Foto ${studentProfile.fullName}`} /><AvatarFallback className="bg-primary/10 text-2xl font-semibold text-primary">{initials}</AvatarFallback></Avatar>
            <span className="absolute bottom-1 right-1 size-4 rounded-full border-2 border-background bg-emerald-500" aria-label="Mahasiswa aktif" />
          </div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-center gap-2 md:justify-start"><h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{studentProfile.fullName}</h1><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">{studentProfile.academicStatus}</Badge></div><p className="mt-2 text-sm font-medium">NIM {studentProfile.nim}</p><p className="mt-1 text-sm text-muted-foreground">{studentProfile.studyProgram} · {studentProfile.faculty}</p></div>
          <div className="flex flex-col items-center gap-2 md:items-end"><input ref={photoInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectPhoto} aria-label="Pilih foto profil" /><Button variant="outline" onClick={() => photoInputRef.current?.click()}><Camera /> Ubah Foto</Button>{pendingPhoto && <div className="flex gap-2"><Button size="sm" onClick={applyPhoto}>Gunakan Foto</Button><Button size="sm" variant="ghost" onClick={() => setPendingPhoto(null)}><RotateCcw /> Batal</Button></div>}</div>
        </CardContent>
      </Card>

      {hasUnsavedChanges && <div role="status" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"><LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p><strong>Perubahan belum disimpan.</strong> Simpan atau batalkan perubahan sebelum meninggalkan halaman.</p></div>}

      <div className="overflow-x-auto" role="tablist" aria-label="Bagian profil"><div className="inline-flex min-w-full gap-1 rounded-xl bg-muted p-1 sm:min-w-0">{tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={cn("min-w-max flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{tab.label}</button>)}</div></div>
      <div role="tabpanel">{activeTab === "personal" && <PersonalTab contact={contact} onEdit={openEdit} />}{activeTab === "academic" && <AcademicTab />}{activeTab === "account" && <AccountTab onChangePassword={() => setPasswordOpen(true)} />}</div>

      <Dialog open={editOpen} onOpenChange={(open) => { if (open) setEditOpen(true); else requestCloseEdit() }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Edit Informasi Kontak</DialogTitle><DialogDescription>Hanya email kontak, nomor HP, dan alamat yang dapat kamu ubah sendiri.</DialogDescription></DialogHeader><form onSubmit={saveContact} className="space-y-4"><div className="space-y-2"><Label htmlFor="profile-email">Email</Label><Input id="profile-email" type="email" value={draft.email} aria-invalid={!!contactErrors.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} />{contactErrors.email && <p role="alert" className="text-xs text-destructive">{contactErrors.email}</p>}</div><div className="space-y-2"><Label htmlFor="profile-phone">No. HP</Label><Input id="profile-phone" inputMode="tel" value={draft.phone} aria-invalid={!!contactErrors.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} />{contactErrors.phone && <p role="alert" className="text-xs text-destructive">{contactErrors.phone}</p>}</div><div className="space-y-2"><Label htmlFor="profile-address">Alamat</Label><Textarea id="profile-address" rows={4} value={draft.address} aria-invalid={!!contactErrors.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} />{contactErrors.address && <p role="alert" className="text-xs text-destructive">{contactErrors.address}</p>}</div>{draftDirty && <p className="text-xs text-amber-700 dark:text-amber-300">Ada perubahan yang belum disimpan.</p>}<DialogFooter><Button type="button" variant="outline" onClick={requestCloseEdit}>Batal</Button><Button type="submit">Simpan Perubahan</Button></DialogFooter></form></DialogContent></Dialog>

      <Dialog open={discardOpen} onOpenChange={setDiscardOpen}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Buang perubahan?</DialogTitle><DialogDescription>Perubahan informasi kontak yang belum disimpan akan hilang.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDiscardOpen(false)}>Lanjut Mengedit</Button><Button variant="destructive" onClick={() => { setDraft(contact); setContactErrors({}); setDiscardOpen(false); setEditOpen(false) }}>Buang Perubahan</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={photoFile !== null} onOpenChange={(open) => { if (!open) setPhotoFile(null) }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>Atur Foto Profil</DialogTitle><DialogDescription>Geser dan sesuaikan area crop 1:1, lalu periksa preview sebelum menggunakan foto.</DialogDescription></DialogHeader>{photoFile && <ImageCrop key={`${photoFile.name}-${photoFile.lastModified}`} file={photoFile} aspect={1} maxImageSize={1024 * 1024} maxOutputSize={512} onCrop={(croppedPhoto) => { setPendingPhoto(croppedPhoto); setPhotoFile(null) }}><ImageCropContent className="mx-auto max-h-[50dvh] w-full [&>img]:max-h-[50dvh] [&>img]:object-contain" /><div className="mt-4 flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => setPhotoFile(null)}>Batal</Button><ImageCropReset asChild><Button variant="outline">Reset Crop</Button></ImageCropReset><ImageCropApply asChild><Button>Preview Foto</Button></ImageCropApply></div></ImageCrop>}</DialogContent></Dialog>

      <PasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </main>
  )
}

function PasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [error, setError] = useState("")
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const current = String(form.get("currentPassword") ?? "")
    const password = String(form.get("newPassword") ?? "")
    const confirmation = String(form.get("confirmPassword") ?? "")
    if (!current || password.length < 12 || password !== confirmation) { setError(!current ? "Password saat ini wajib diisi." : password.length < 12 ? "Password baru minimal 12 karakter." : "Konfirmasi password tidak sama."); toast.error("Password belum dapat diubah. Periksa kembali inputmu."); return }
    setError("")
    onOpenChange(false)
    toast.success("Simulasi perubahan password berhasil.", { description: "Tidak ada data akun asli yang diubah." })
  }
  return <Dialog open={open} onOpenChange={(next) => { setError(""); onOpenChange(next) }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Ubah Password</DialogTitle><DialogDescription>Gunakan minimal 12 karakter. Ini adalah simulasi lokal dan tidak mengubah akun asli.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="current-password">Password saat ini</Label><Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" /></div><div className="space-y-2"><Label htmlFor="new-password">Password baru</Label><Input id="new-password" name="newPassword" type="password" autoComplete="new-password" /></div><div className="space-y-2"><Label htmlFor="confirm-password">Konfirmasi password baru</Label><Input id="confirm-password" name="confirmPassword" type="password" autoComplete="new-password" /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit"><CheckCircle2 /> Simpan Password</Button></DialogFooter></form></DialogContent></Dialog>
}
