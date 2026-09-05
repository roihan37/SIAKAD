import { useEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Camera, Check, ChevronDown, Loader2 } from "lucide-react"
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
  { label: "DO", value: "DO" },
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
  return date.toISOString().slice(0, 10)
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
  const initializedFaculty = useRef<number | null>(null)

  
  const form = useForm<MahasiswaEditFormInput, unknown, MahasiswaEditFormValues>({
    resolver: zodResolver(mahasiswaEditSchema),
    mode: "onChange",
    defaultValues: { nim: "", name: "", email: "", username: "", password: "", gender: undefined, phoneNumber: "", address: "", birthDate: undefined, angkatan: 2000, semester: 1, status: "Aktif", fakultasId: 0, prodiId: 0, dosenId: "" },
  })
  const { register, reset, setValue, watch, handleSubmit, formState: { errors, isDirty } } = form
  const fakultasId = watch("fakultasId")
  const prodiId = watch("prodiId")
  const selectedStatus = watch("status")

  
  useEffect(() => {
    if (id && (!studentDetail || studentDetail.student.id !== id)) dispatch(getStudentById(id))
    dispatch(getAllFakultas({ limit: 100 }))
  }, [dispatch, id])

  useEffect(() => {
    if (!fakultasId) return
    dispatch(getAllProdi({ page: 1, limit: 100, search: "", sortBy: "name", sortOrder: "asc", fakultasId }))
    if (initializedFaculty.current !== null && initializedFaculty.current !== fakultasId) setValue("prodiId", 0, { shouldDirty: true })
    initializedFaculty.current = fakultasId
  }, [dispatch, fakultasId, setValue])

  useEffect(() => {
    if (!studentDetail) return
    const student = studentDetail.student
    const gender = student.jenisKelamin === "L" ? "Male" : student.jenisKelamin === "P" ? "Female" : undefined
    const birthDate = student.tanggalLahir ? new Date(`${student.tanggalLahir}T00:00:00`) : undefined
    const facultyId = Number(student.fakultas?.id ?? 0)
    initializedFaculty.current = facultyId || null
    const status = statusOptions.some((option) => option.value === student.status) ? student.status as MahasiswaStatus : "Aktif"
    reset({ nim: student.nim, name: student.nama, email: student.email, username: student.nim, password: "", gender, nik: student.nik ?? "", birthPlace: student.tempatLahir ?? "", phoneNumber: student.noHp ?? "", address: student.alamat ?? "", birthDate, angkatan: student.angkatan, semester: student.summary.semester, status, fakultasId: facultyId, prodiId: Number(student.prodi?.id ?? 0), dosenId: student.dosenPembimbing?.id ?? "" })
    setPhotoChanged(false)
    setAvatarKey(undefined)
    setPhotoPreview(null)
  }, [reset, studentDetail])

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (isDirty) { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (prodiId) dispatch(getAllLecturers({ page: 1, limit: 100, search: "", sortBy: "name", sortOrder: "asc", prodiId: Number(prodiId) }))
  }, [dispatch, prodiId])

  const leavePage = () => navigate(id ? `/mahasiswa/${id}` : "/mahasiswa")
  const handleBack = () => isDirty || photoChanged ? setConfirmLeaveOpen(true) : leavePage()

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
  if (!id) return

  if (selectedPhoto && !croppedPhoto) {
    toast.error(
      "Terapkan crop foto terlebih dahulu sebelum menyimpan"
    )
    return
  }

  setIsSaving(true)

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
            values.birthDate
              ?.toISOString()
              .split("T")[0],

          gender: values.gender,

          nim: values.nim,
          angkatan: values.angkatan,
          semester: values.semester,
          status: values.status,
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
    await dispatch(
      getStudentById(id)
    ).unwrap()

    // ==========================================
    // 4. Success
    // ==========================================
    toast.success(
      "Data mahasiswa berhasil diperbarui"
    )

    leavePage()
  } catch (error) {
    toast.error(
      getErrorMessage(error)
    )
  } finally {
    setIsSaving(false)
    setUploadingPhoto(false)
  }
}

  if (!studentDetail) return <main className="mx-auto max-w-4xl p-6">Memuat data mahasiswa...</main>
  const student = studentDetail.student
  const initials = student.nama.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()

  return <>
    <main className="mx-auto w-full max-w-6xl space-y-5 py-5 pb-6 sm:py-7">
      <button type="button" onClick={handleBack} className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Kembali ke Detail Mahasiswa</button>
      <header className="border-b pb-5"><p className="text-sm font-medium text-primary">Data Mahasiswa</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Edit Mahasiswa</h1><p className="mt-1 text-sm text-muted-foreground">Perbarui informasi mahasiswa dengan data terbaru.</p></header>

      <Card><CardContent className="flex flex-col gap-5 pt-6 sm:flex-row sm:items-start"><div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-semibold text-primary">{photoPreview ? <img src={photoPreview} alt="Pratinjau foto mahasiswa" className="size-full object-cover" /> : student.avatarUrl ? <img src={student.avatarUrl} alt={`Foto ${student.nama}`} className="size-full object-cover" /> : initials}<span className="absolute inset-0 rounded-full ring-1 ring-inset ring-border" /></div><div className="min-w-0 flex-1 text-center sm:text-left"><p className="font-medium">Foto Mahasiswa</p><p className="mt-1 text-xs text-muted-foreground">Pilih foto maksimal 1 MB, lalu crop sebelum disimpan.</p><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" /><div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start"><Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>{uploadingPhoto ? <Loader2 className="animate-spin" /> : <Camera />} Ubah Foto</Button>{selectedPhoto && <Button type="button" variant="ghost" size="sm" onClick={handleResetPhoto}><XIcon /> Batal</Button>}</div>{selectedPhoto && !croppedPhoto && <div className="mt-4 w-full max-w-xl rounded-xl border bg-muted/30 p-3"><p className="mb-3 text-xs text-muted-foreground">Atur area foto agar wajah berada di tengah.</p><div className="mx-auto flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-lg bg-background"><ImageCrop aspect={1} file={selectedPhoto} maxImageSize={1024 * 1024} onChange={() => {}} onComplete={() => {}} onCrop={(value) => { setCroppedPhoto(value); setPhotoPreview(value) }}><ImageCropContent className="mx-auto max-h-[360px] w-full max-w-md [&>img]:!h-auto [&>img]:!w-auto [&>img]:max-h-[336px] [&>img]:max-w-full [&>img]:object-contain" /><div className="mt-3 flex items-center gap-2"><ImageCropApply /><ImageCropReset /></div></ImageCrop></div></div>}{selectedPhoto && croppedPhoto && <p className="mt-3 text-xs text-emerald-600">Crop foto siap diupload saat menyimpan.</p>}</div></CardContent></Card>

      <form id="student-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>Data Identitas</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
          <Field><FieldLabel>NIM</FieldLabel><Input {...register("nim")} disabled className="bg-muted" /><FieldError>{errors.nim?.message}</FieldError></Field>
          <Field data-invalid={!!errors.name}><FieldLabel>Nama Lengkap</FieldLabel><Input {...register("name")} aria-invalid={!!errors.name} /><FieldError>{errors.name?.message}</FieldError></Field>
          <Field data-invalid={!!errors.nik}><FieldLabel>NIK</FieldLabel><Input {...register("nik")} aria-invalid={!!errors.nik} /><FieldError>{errors.nik?.message}</FieldError></Field>
          <Controller control={form.control} name="gender" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Jenis Kelamin</FieldLabel><Select items={genderOptions} value={field.value ?? ""} onValueChange={(value) => field.onChange(value ?? undefined)}><SelectTrigger aria-invalid={fieldState.invalid} className="w-full"><SelectValue placeholder="Pilih jenis kelamin" /></SelectTrigger><SelectContent><SelectGroup>{genderOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Field data-invalid={!!errors.birthPlace}><FieldLabel>Tempat Lahir</FieldLabel><Input {...register("birthPlace")} aria-invalid={!!errors.birthPlace} /><FieldError>{errors.birthPlace?.message}</FieldError></Field>
          <Controller control={form.control} name="birthDate" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Tanggal Lahir</FieldLabel><Input type="date" value={formatDateInput(field.value)} onChange={(event) => field.onChange(event.target.value ? new Date(`${event.target.value}T00:00:00`) : undefined)} aria-invalid={fieldState.invalid} /><FieldError>{fieldState.error?.message}</FieldError></Field>} />
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Kontak</CardTitle></CardHeader><CardContent className="grid gap-5"><Field data-invalid={!!errors.email}><FieldLabel>Email</FieldLabel><Input type="email" {...register("email")} aria-invalid={!!errors.email} /><FieldError>{errors.email?.message}</FieldError></Field><Field data-invalid={!!errors.phoneNumber}><FieldLabel>No. HP</FieldLabel><Input {...register("phoneNumber")} aria-invalid={!!errors.phoneNumber} /><FieldError>{errors.phoneNumber?.message}</FieldError></Field><Field data-invalid={!!errors.address}><FieldLabel>Alamat</FieldLabel><textarea {...register("address")} rows={4} aria-invalid={!!errors.address} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" /><FieldError>{errors.address?.message}</FieldError></Field></CardContent></Card>

        <Card><CardHeader><CardTitle>Data Akademik</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
          <Controller control={form.control} name="fakultasId" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Fakultas</FieldLabel><Select items={fakultas.map((item) => ({ label: item.name, value: String(item.id) }))} value={field.value ? String(field.value) : ""} onValueChange={(value) => { field.onChange(Number(value)); setValue("prodiId", 0, { shouldDirty: true }); setValue("dosenId", "", { shouldDirty: true }) }}><SelectTrigger aria-invalid={fieldState.invalid} className="w-full"><SelectValue placeholder="Pilih fakultas" /></SelectTrigger><SelectContent><SelectGroup>{fakultas.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Controller control={form.control} name="prodiId" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Program Studi</FieldLabel><Select items={prodi.map((item) => ({ label: item.name, value: String(item.id) }))} value={field.value ? String(field.value) : ""} onValueChange={(value) => { field.onChange(Number(value)); setValue("dosenId", "", { shouldDirty: true }) }} disabled={!fakultasId}><SelectTrigger aria-invalid={fieldState.invalid} className="w-full"><SelectValue placeholder={fakultasId ? "Pilih program studi" : "Pilih fakultas dulu"} /></SelectTrigger><SelectContent><SelectGroup>{prodi.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <Field data-invalid={!!errors.angkatan}><FieldLabel>Angkatan</FieldLabel><Input type="number" {...register("angkatan", { valueAsNumber: true })} aria-invalid={!!errors.angkatan} /><FieldError>{errors.angkatan?.message}</FieldError></Field>
          <Controller control={form.control} name="dosenId" render={({ field, fieldState }) => <Field data-invalid={fieldState.invalid}><FieldLabel>Dosen Pembimbing Akademik</FieldLabel><Select items={lecturers.map((item) => ({ label: item.name, value: item.dosen.id }))} value={field.value || ""} onValueChange={field.onChange} disabled={!prodiId}><SelectTrigger aria-invalid={fieldState.invalid} className="w-full"><SelectValue placeholder={prodiId ? "Pilih dosen PA" : "Pilih program studi dulu"} /></SelectTrigger><SelectContent><SelectGroup>{lecturers.map((item) => <SelectItem key={item.dosen.id} value={item.dosen.id}>{item.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FieldError>{fieldState.error?.message}</FieldError></Field>} />
          <div className="space-y-2"><FieldLabel>Status Mahasiswa</FieldLabel><div className="flex items-center gap-3"><Badge variant="secondary" className="px-3 py-1">{selectedStatus}</Badge><Button type="button" variant="outline" size="sm" onClick={() => { setPendingStatus(selectedStatus); setStatusDialogOpen(true) }}>Ubah Status <ChevronDown /></Button></div></div>
        </CardContent></Card>
      </form>

      <div className="sticky bottom-4 z-20 rounded-xl border bg-background p-3 shadow-lg shadow-black/5 supports-backdrop-filter:bg-background/90 supports-backdrop-filter:backdrop-blur-md sm:p-4"><div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{isDirty || photoChanged ? "Perubahan belum disimpan" : "Belum ada perubahan"}</p><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={handleBack}>Batal</Button><Button type="submit" form="student-edit-form" disabled={(!isDirty && !photoChanged) || isSaving || uploadingPhoto}>{isSaving ? <Loader2 className="animate-spin" /> : <Check />} {isSaving ? "Menyimpan..." : "Simpan Perubahan"}</Button></div></div></div>
    </main>

    <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}><DialogContent><DialogHeader><DialogTitle>Ubah Status Mahasiswa</DialogTitle><DialogDescription>Perubahan status akan dicatat sebagai bagian dari pembaruan data.</DialogDescription></DialogHeader><div className="space-y-4"><div className="rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="text-muted-foreground">Status Saat Ini</span><p className="mt-1 font-semibold">{student.status ?? "-"}</p></div><Field><FieldLabel>Status Baru</FieldLabel><Select items={statusOptions} value={pendingStatus} onValueChange={(value) => value && setPendingStatus(value as MahasiswaStatus)}><SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger><SelectContent><SelectGroup>{statusOptions.map((status) => <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>)}</SelectGroup></SelectContent></Select></Field><Field><FieldLabel>Alasan</FieldLabel><textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} rows={3} placeholder="Pengajuan cuti semester..." className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm" /></Field></div><DialogFooter><Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>Batal</Button><Button type="button" onClick={() => { setValue("status", pendingStatus, { shouldDirty: true, shouldValidate: true }); setStatusDialogOpen(false) }}>Ubah Status</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}><DialogContent><DialogHeader><DialogTitle>Perubahan belum disimpan</DialogTitle><DialogDescription>Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setConfirmLeaveOpen(false)}>Tetap Edit</Button><Button type="button" variant="destructive" onClick={leavePage}>Buang Perubahan</Button></DialogFooter></DialogContent></Dialog>
  </>
}
