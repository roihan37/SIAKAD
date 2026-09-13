import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Camera, Check, ChevronDown, FilePenLine, Loader2, UserRound, ContactRound, GraduationCap, Info } from "lucide-react"
import { XIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageCrop, ImageCropApply, ImageCropContent, ImageCropReset } from "@/components/kibo-ui/image-crop"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getStudentAvatarUploadUrl, getStudentById, updateStudent } from "@/features/action/mahasiswaThunk"
import { getAllFakultas, getAllProdi } from "@/features/action/campusThunk"
import { getAllLecturers } from "@/features/action/dosenThunk"
import { mahasiswaEditSchema, type MahasiswaEditFormInput, type MahasiswaEditFormValues } from "@/schemas"

const genderOptions = [{ label: "Laki-laki", value: "Male" }, { label: "Perempuan", value: "Female" }]
const statusOptions = [
  { label: "Aktif", value: "Aktif" },
  { label: "Cuti", value: "Cuti" },
  { label: "Lulus", value: "Lulus" },
  { label: "Nonaktif", value: "Nonaktif" },
]
type MahasiswaStatus = MahasiswaEditFormValues["status"]

async function dataUrlToBlob(
  dataUrl: string
): Promise<Blob> {
  const response = await fetch(dataUrl)

  if (!response.ok) {
    throw new Error(
      "Gagal memproses foto hasil crop"
    )
  }

  return response.blob()
}


function getErrorMessage(error: unknown) {
  if (typeof error === "string") return error
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message)
  }
  return "Terjadi kesalahan saat memperbarui data mahasiswa."
}

function formatDateInput(date?: Date) {
  if (!date || Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export default function MahasiswaEditPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { id } = useParams()
  const { studentDetail } = useAppSelector((state) => state.students)
  const { fakultas, prodi } = useAppSelector((state) => state.campus)
  const { lecturers } = useAppSelector((state) => state.lecturers)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<MahasiswaStatus>("Aktif")
  const [statusReason, setStatusReason] = useState("")
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [croppedPhoto, setCroppedPhoto] = useState<string | null>(null)
  const [photoChanged, setPhotoChanged] = useState(false)
  const [avatarKey, setAvatarKey] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailAttempt, setDetailAttempt] = useState(0)
  const [detailLoading, setDetailLoading] = useState(true)
  const initializedFaculty = useRef<number | null>(null)

  
  const form = useForm<MahasiswaEditFormInput, unknown, MahasiswaEditFormValues>({
    resolver: zodResolver(mahasiswaEditSchema),
    mode: "onChange",
    defaultValues: { nim: "", name: "", email: "", gender: undefined, phoneNumber: "", address: "", birthDate: undefined, angkatan: 2000, status: "Aktif", fakultasId: 0, prodiId: 0, dosenId: "" },
  })
  const { register, reset, setValue, watch, handleSubmit, formState: { errors, isDirty } } = form
  const fakultasId = watch("fakultasId")
  const prodiId = watch("prodiId")
  const selectedStatus = watch("status")

  
  useEffect(() => {
    let active = true
    setDetailLoading(true)
    setDetailError(null)
    if (!id) { setDetailError("ID mahasiswa tidak tersedia."); setDetailLoading(false); return }
    const request = dispatch(getStudentById(id))
    void request.unwrap().catch((error: unknown) => {
      if (active) setDetailError(getErrorMessage(error))
    }).finally(() => { if (active) setDetailLoading(false) })
    return () => { active = false }
  }, [dispatch, id, detailAttempt])

  useEffect(() => { void dispatch(getAllFakultas({ limit: 100 })) }, [dispatch])

  useEffect(() => {
    if (!fakultasId) return
    dispatch(getAllProdi({ page: 1, limit: 100, search: "", sortBy: "name", sortOrder: "asc", fakultasId }))
    if (initializedFaculty.current !== null && initializedFaculty.current !== fakultasId) setValue("prodiId", 0, { shouldDirty: true })
    initializedFaculty.current = fakultasId
  }, [dispatch, fakultasId, setValue])

  useEffect(() => {
    if (!studentDetail || studentDetail.student.id !== id) return
    const student = studentDetail.student
    const gender = student.jenisKelamin === "L" ? "Male" : student.jenisKelamin === "P" ? "Female" : undefined
    const birthDate = student.tanggalLahir ? new Date(`${student.tanggalLahir}T00:00:00`) : undefined
    const facultyId = Number(student.fakultas?.id ?? 0)
    initializedFaculty.current = facultyId || null
    const status = statusOptions.some((option) => option.value === student.status) ? student.status as MahasiswaStatus : "Aktif"
    reset({ nim: student.nim, name: student.nama, email: student.email, gender, nik: student.nik ?? "", birthPlace: student.tempatLahir ?? "", phoneNumber: student.noHp ?? "", address: student.alamat ?? "", birthDate, angkatan: student.angkatan, status, fakultasId: facultyId, prodiId: Number(student.prodi?.id ?? 0), dosenId: student.dosenPembimbing?.id ?? "" })
    setPhotoChanged(false)
    setAvatarKey(undefined)
    setPhotoPreview(null)
  }, [reset, studentDetail, id])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (isDirty || photoChanged) { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [isDirty, photoChanged])

  useEffect(() => {
    if (prodiId) dispatch(getAllLecturers({ page: 1, limit: 100, search: "", sortBy: "name", sortOrder: "asc", prodiId: Number(prodiId) }))
  }, [dispatch, prodiId])

  const leavePage = () => {
    if (typeof window.history.state?.idx === "number" && window.history.state.idx > 0) {
      navigate(-1)
      return
    }
    navigate(id ? `/mahasiswa/${id}` : "/mahasiswa", { replace: true })
  }
  const handleBack = () => isDirty || photoChanged ? setConfirmLeaveOpen(true) : leavePage()

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 1024 * 1024) { toast.error("Foto harus berupa gambar dengan ukuran maksimal 1 MB"); return }
    setSelectedPhoto(file)
    setCroppedPhoto(null)
    setPhotoPreview(null)
    setPhotoChanged(true)
  }

  const handleResetPhoto = () => {
    setSelectedPhoto(null)
    setCroppedPhoto(null)
    setPhotoPreview(null)
    setPhotoChanged(false)
  }

  const onSubmit = async (
  values: MahasiswaEditFormValues
) => {
  if (!id || savingRef.current) return

  if (selectedPhoto && !croppedPhoto) {
    toast.error(
      "Terapkan crop foto terlebih dahulu sebelum menyimpan"
    )
    return
  }

  savingRef.current = true
  setIsSaving(true)

  let updateDispatched = false
  try {
    let uploadedAvatarKey = avatarKey

    // ==========================================
    // 1. Upload foto jika ada perubahan
    // ==========================================
    if (croppedPhoto) {
      setUploadingPhoto(true)

      const blob = await dataUrlToBlob(
        croppedPhoto
      )

      const contentType =
        blob.type || "image/png"

      const {
        uploadUrl,
        key,
      } = await dispatch(
        getStudentAvatarUploadUrl({
          id,
          contentType,
        })
      ).unwrap()

      const uploadResponse = await fetch(
        uploadUrl,
        {
          method: "PUT",
          headers: {
            "Content-Type": contentType,
          },
          body: blob,
        }
      )

      if (!uploadResponse.ok) {
        throw new Error(
          "Upload foto ke storage gagal"
        )
      }

      uploadedAvatarKey = key
    }

    // ==========================================
    // 2. Update data mahasiswa
    // ==========================================
    updateDispatched = true
    await dispatch(
      updateStudent({
        id,

        payload: {
          name: values.name,
          email: values.email,
          nik: values.nik,
          birthPlace: values.birthPlace,
          phoneNumber: values.phoneNumber,
          address: values.address,

          birthDate:
            values.birthDate ? formatDateInput(values.birthDate) : undefined,

          gender: values.gender,

          nim: values.nim,
          angkatan: values.angkatan,
          status: values.status,
          // Server mencatat riwayat status dan mewajibkan alasan saat status berubah.
          ...(values.status !== student.status
            ? { statusReason: statusReason.trim() }
            : {}),
          prodiId: values.prodiId,
          dosenId: values.dosenId,

          ...(uploadedAvatarKey
            ? {
                avatarKey:
                  uploadedAvatarKey,
              }
            : {}),
        },
      })
    ).unwrap()

    // ==========================================
    // 3. Refresh detail mahasiswa
    // ==========================================
    // The detail page fetches fresh data after navigation. A refresh failure must
    // not turn a successful update into a failed-save message.

    // ==========================================
    // 4. Success
    // ==========================================
    // Success/error notifications for updateStudent are owned by toastMiddleware.

    navigate(id ? `/mahasiswa/${id}` : "/mahasiswa")
  } catch (error) {
    if (!updateDispatched) toast.error(getErrorMessage(error))
  } finally {
    savingRef.current = false
    setIsSaving(false)
    setUploadingPhoto(false)
  }
}

  if (detailError) return <main className="mx-auto max-w-4xl space-y-4 p-6" role="alert"><h1 className="text-xl font-semibold">Data mahasiswa gagal dimuat</h1><p className="text-sm text-muted-foreground">{detailError}</p><div className="flex gap-3"><Button variant="outline" onClick={leavePage}>Kembali</Button><Button onClick={() => setDetailAttempt((value) => value + 1)}>Coba Lagi</Button></div></main>
  if (detailLoading || !studentDetail || studentDetail.student.id !== id) return <main className="mx-auto max-w-4xl p-6">Memuat data mahasiswa...</main>
  const student = studentDetail.student
  const initials = student.nama.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()

  return <>
    <main className="mx-auto w-full max-w-7xl space-y-6 px-1 py-5 pb-6 sm:py-7">
        <button type="button" onClick={handleBack} disabled={isSaving} className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Kembali</button>
      <header className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FilePenLine className="size-5" /></div>
            <div>
              <p className="text-sm font-medium text-primary">Data Mahasiswa</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Edit Mahasiswa</h1>
              <p className="mt-1 text-sm text-muted-foreground">Kelola identitas, kontak, dan informasi akademik mahasiswa.</p>
            </div>
          </div>
          <Badge variant="outline" className="w-fit gap-2 rounded-full px-3 py-1.5"><span className={`size-2 rounded-full ${isDirty || photoChanged ? "bg-amber-500" : "bg-emerald-500"}`} />{isDirty || photoChanged ? "Ada perubahan" : "Data tersimpan"}</Badge>
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-22">
      <Card className="rounded-2xl"><CardContent className="flex flex-col items-center gap-4 pt-3"><div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-semibold text-primary">{photoPreview ? <img src={photoPreview} alt="Pratinjau foto mahasiswa" className="size-full object-cover" /> : student.avatarUrl ? <img src={student.avatarUrl} alt={`Foto ${student.nama}`} className="size-full object-cover" /> : initials}<span className="absolute inset-0 rounded-full ring-1 ring-inset ring-border" /></div><div className="min-w-0 w-full text-center"><h2 className="break-words text-lg font-semibold">{student.nama}</h2><p className="mt-1 text-sm text-muted-foreground">NIM {student.nim}</p><Badge variant="secondary" className="mt-3">{selectedStatus}</Badge><p className="mt-5 text-sm font-medium">Foto profil</p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, atau WebP. Maksimal 1 MB.</p><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" /><div className="mt-3 flex flex-wrap justify-center gap-2 "><Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>{uploadingPhoto ? <Loader2 className="animate-spin" /> : <Camera />} Ubah Foto</Button>{selectedPhoto && <Button type="button" variant="ghost" size="sm" disabled={isSaving} onClick={handleResetPhoto}><XIcon /> Batal</Button>}</div>{selectedPhoto && !croppedPhoto && <div className="mt-4 w-full max-w-xl rounded-xl border bg-muted/30 p-3"><p className="mb-3 text-xs text-muted-foreground">Atur area foto agar wajah berada di tengah.</p><div className="mx-auto w-full max-w-md rounded-lg bg-background"><ImageCrop aspect={1} file={selectedPhoto} maxImageSize={1024 * 1024} onChange={() => {}} onComplete={() => {}} onCrop={(value) => { setCroppedPhoto(value); setPhotoPreview(value) }}><ImageCropContent className="mx-auto max-h-[360px] w-full max-w-md [&>img]:!h-auto [&>img]:!w-auto [&>img]:max-h-[336px] [&>img]:max-w-full [&>img]:object-contain" /><div className="mt-3 flex items-center gap-2"><ImageCropApply /><ImageCropReset /></div></ImageCrop></div></div>}{selectedPhoto && croppedPhoto && <p className="mt-3 text-xs text-emerald-600">Crop foto siap diupload saat menyimpan.</p>}</div></CardContent></Card>

      <nav aria-label="Bagian formulir" className="rounded-2xl border bg-card p-2">
        {[{ id: "identitas", label: "Data identitas", icon: UserRound, number: "01" }, { id: "kontak", label: "Informasi kontak", icon: ContactRound, number: "02" }, { id: "akademik", label: "Data akademik", icon: GraduationCap, number: "03" }].map(({ id: sectionId, label, icon: Icon, number }) => <a key={sectionId} href={`#${sectionId}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"><Icon className="size-4" />{label}<span className="ml-auto text-xs opacity-60">{number}</span></a>)}
      </nav>
      <div className="flex gap-2.5 rounded-xl bg-muted/50 p-4 text-xs leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" /><p>Periksa kembali data sebelum menyimpan. Perubahan status mahasiswa memerlukan alasan untuk riwayat akademik.</p></div>
      </aside>

      <form id="student-edit-form" onSubmit={handleSubmit(onSubmit, () => toast.error("Periksa kembali kolom yang ditandai sebelum menyimpan."))} className="min-w-0 space-y-6">
        <fieldset disabled={isSaving} className="min-w-0 space-y-6">
        <Card id="identitas" className="scroll-mt-22 rounded-2xl [--card-spacing:--spacing(6)]"><CardHeader className="border-b"><div className="mb-1 flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">01</span><CardTitle><h2>Data Identitas</h2></CardTitle></div><p className="text-sm text-muted-foreground">Informasi pribadi sesuai dokumen resmi mahasiswa.</p></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
          <Field><FieldLabel htmlFor="nim">NIM</FieldLabel><Input id="nim" {...register("nim")} readOnly aria-readonly="true" className="bg-muted text-muted-foreground" /><p className="text-xs text-muted-foreground">NIM merupakan identitas tetap mahasiswa.</p><FieldError>{errors.nim?.message}</FieldError></Field>
          <Field data-invalid={!!errors.name}><FieldLabel htmlFor="name">Nama Lengkap</FieldLabel><Input id="name" {...register("name")} aria-invalid={!!errors.name} /><FieldError>{errors.name?.message}</FieldError></Field>
          <Field data-invalid={!!errors.nik}><FieldLabel htmlFor="nik">NIK</FieldLabel><Input inputMode="numeric" maxLength={16} id="nik" {...register("nik")} aria-invalid={!!errors.nik} /><FieldError>{errors.nik?.message}</FieldError></Field>
          <Controller control={form.control} name="gender" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="gender">Jenis Kelamin</FieldLabel><Select items={genderOptions} value={field.value ?? ""} onValueChange={(value) => field.onChange(value ?? undefined)}><SelectTrigger id="gender" aria-invalid={fieldState.invalid} className="w-full"><SelectValue placeholder="Pilih jenis kelamin" /></SelectTrigger><SelectContent><SelectGroup>{genderOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Field data-invalid={!!errors.birthPlace}><FieldLabel htmlFor="birthPlace">Tempat Lahir</FieldLabel><Input id="birthPlace" {...register("birthPlace")} aria-invalid={!!errors.birthPlace} /><FieldError>{errors.birthPlace?.message}</FieldError></Field>
          <Controller control={form.control} name="birthDate" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="birthDate">Tanggal Lahir</FieldLabel><Input id="birthDate" type="date" value={formatDateInput(field.value)} onChange={(event) => field.onChange(event.target.value ? new Date(`${event.target.value}T00:00:00`) : undefined)} aria-invalid={fieldState.invalid} /><FieldError>{fieldState.error?.message}</FieldError></Field>} />
        </CardContent></Card>

        <Card id="kontak" className="scroll-mt-22 rounded-2xl [--card-spacing:--spacing(6)]"><CardHeader className="border-b"><div className="mb-1 flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">02</span><CardTitle><h2>Kontak</h2></CardTitle></div><p className="text-sm text-muted-foreground">Gunakan kontak aktif agar mahasiswa mudah dihubungi.</p></CardHeader><CardContent className="grid gap-5"><Field data-invalid={!!errors.email}><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} /><FieldError>{errors.email?.message}</FieldError></Field><Field data-invalid={!!errors.phoneNumber}><FieldLabel htmlFor="phoneNumber">No. HP</FieldLabel><Input type="tel" autoComplete="tel" id="phoneNumber" {...register("phoneNumber")} aria-invalid={!!errors.phoneNumber} /><FieldError>{errors.phoneNumber?.message}</FieldError></Field><Field data-invalid={!!errors.address}><FieldLabel htmlFor="address">Alamat</FieldLabel><textarea id="address" {...register("address")} rows={4} aria-invalid={!!errors.address} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" /><FieldError>{errors.address?.message}</FieldError></Field></CardContent></Card>

        <Card id="akademik" className="scroll-mt-22 rounded-2xl [--card-spacing:--spacing(6)]"><CardHeader className="border-b"><div className="mb-1 flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">03</span><CardTitle><h2>Data Akademik</h2></CardTitle></div><p className="text-sm text-muted-foreground">Atur penempatan program studi dan pembimbing akademik.</p></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
          <Controller control={form.control} name="fakultasId" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="fakultasId">Fakultas</FieldLabel><Select items={fakultas.map((item) => ({ label: item.name, value: String(item.id) }))} value={field.value ? String(field.value) : ""} onValueChange={(value) => { field.onChange(Number(value)); setValue("prodiId", 0, { shouldDirty: true }); setValue("dosenId", "", { shouldDirty: true }) }}><SelectTrigger id="fakultasId" aria-invalid={fieldState.invalid} className="w-full"><SelectValue placeholder="Pilih fakultas" /></SelectTrigger><SelectContent><SelectGroup>{fakultas.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Controller control={form.control} name="prodiId" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="prodiId">Program Studi</FieldLabel><Select items={prodi.map((item) => ({ label: item.name, value: String(item.id) }))} value={field.value ? String(field.value) : ""} onValueChange={(value) => { field.onChange(Number(value)); setValue("dosenId", "", { shouldDirty: true }) }} disabled={!fakultasId}><SelectTrigger id="prodiId" aria-invalid={fieldState.invalid} className="w-full"><SelectValue placeholder={fakultasId ? "Pilih program studi" : "Pilih fakultas dulu"} /></SelectTrigger><SelectContent><SelectGroup>{prodi.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Field data-invalid={!!errors.angkatan}><FieldLabel htmlFor="angkatan">Angkatan</FieldLabel><Input id="angkatan" type="number" {...register("angkatan", { valueAsNumber: true })} aria-invalid={!!errors.angkatan} /><FieldError>{errors.angkatan?.message}</FieldError></Field>
          <Controller control={form.control} name="dosenId" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel htmlFor="dosenId">Dosen Pembimbing Akademik</FieldLabel><Select items={lecturers.map((item) => ({ label: item.name, value: item.dosen.id }))} value={field.value || ""} onValueChange={field.onChange} disabled={!prodiId}><SelectTrigger id="dosenId" aria-invalid={fieldState.invalid} className="w-full"><SelectValue placeholder={prodiId ? "Pilih dosen PA" : "Pilih program studi dulu"} /></SelectTrigger><SelectContent><SelectGroup>{lecturers.map((item) => <SelectItem key={item.dosen.id} value={item.dosen.id}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <div className="space-y-2"><p className="text-sm font-medium">Status Mahasiswa</p><div className="flex items-center gap-3"><Badge variant="secondary" className="px-3 py-1">{selectedStatus}</Badge><Button type="button" variant="outline" size="sm" onClick={() => { setPendingStatus(selectedStatus); setStatusDialogOpen(true) }}>Ubah Status <ChevronDown /></Button></div>{selectedStatus !== student.status && <p className="text-xs leading-relaxed text-muted-foreground">Alasan: {statusReason}</p>}</div>
        </CardContent></Card>
        </fieldset>
      </form>
      </div>

      <div className="sticky bottom-3 z-20 rounded-xl border bg-background p-3 shadow-lg shadow-black/5 supports-backdrop-filter:bg-background/90 supports-backdrop-filter:backdrop-blur-md sm:p-4"><div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p role="status" className="text-xs text-muted-foreground">{isDirty || photoChanged ? "Perubahan belum disimpan" : "Belum ada perubahan"}</p><div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={isSaving} onClick={handleBack}>Batal</Button><Button type="submit" form="student-edit-form" disabled={(!isDirty && !photoChanged) || isSaving || uploadingPhoto}>{isSaving ? <Loader2 className="animate-spin" /> : <Check />} {isSaving ? "Menyimpan..." : "Simpan Perubahan"}</Button></div></div></div>
    </main>

    <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}><DialogContent><DialogHeader><DialogTitle>Ubah Status Mahasiswa</DialogTitle><DialogDescription>Perubahan status akan dicatat sebagai bagian dari pembaruan data.</DialogDescription></DialogHeader><div className="space-y-4"><div className="rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="text-muted-foreground">Status Saat Ini</span><p className="mt-1 font-semibold">{student.status ?? "-"}</p></div><Field><FieldLabel htmlFor="pending-status">Status Baru</FieldLabel><Select items={statusOptions} value={pendingStatus} onValueChange={(value) => value && setPendingStatus(value as MahasiswaStatus)}><SelectTrigger id="pending-status" className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger><SelectContent><SelectGroup>{statusOptions.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel htmlFor="status-reason">Alasan</FieldLabel><textarea id="status-reason" value={statusReason} onChange={(event) => setStatusReason(event.target.value)} rows={3} placeholder="Pengajuan cuti semester..." className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm" /></Field></div><DialogFooter><Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>Batal</Button><Button type="button" onClick={() => { if (pendingStatus !== student.status && !statusReason.trim()) { toast.error("Alasan perubahan status wajib diisi"); return } setValue("status", pendingStatus, { shouldDirty: true, shouldValidate: true }); setStatusDialogOpen(false) }}>Ubah Status</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}><DialogContent><DialogHeader><DialogTitle>Perubahan belum disimpan</DialogTitle><DialogDescription>Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setConfirmLeaveOpen(false)}>Tetap Edit</Button><Button type="button" variant="destructive" onClick={leavePage}>Buang Perubahan</Button></DialogFooter></DialogContent></Dialog>
  </>
}
