import { useEffect, useRef, useState } from "react"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Camera, Check, ChevronDown, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getStudentAvatarUploadUrl, getStudentById, updateStudent } from "@/features/action/mahasiswaThunk"
import { getAllFakultas, getAllProdi } from "@/features/action/campusThunk"
import { getAllLecturers } from "@/features/action/dosenThunk"
import { mahasiswaSchema } from "@/schemas"

const genderOptions = [{ label: "Laki-laki", value: "Male" }, { label: "Perempuan", value: "Female" }]
const statusOptions = ["Aktif", "Cuti", "Lulus", "DO"]
const mahasiswaEditSchema = mahasiswaSchema.extend({
  password: z.string().optional(),
  nik: z.string().optional(),
  birthPlace: z.string().optional(),
})
type MahasiswaEditValues = z.output<typeof mahasiswaEditSchema>

type FieldProps = { label: string; error?: string; children: React.ReactNode }
function FormField({ label, error, children }: FieldProps) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{error && <p className="text-xs text-destructive">{error}</p>}</div>
}

export default function MahasiswaEditPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { id } = useParams()
  const { studentDetail } = useAppSelector((state) => state.students)
  const { fakultas, prodi } = useAppSelector((state) => state.campus)
  const { lecturers } = useAppSelector((state) => state.lecturers)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState("Aktif")
  const [statusReason, setStatusReason] = useState("")
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoChanged, setPhotoChanged] = useState(false)
  const [avatarKey, setAvatarKey] = useState<string | undefined>()
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initializedFaculty = useRef<number | null>(null)

  const form = useForm<z.input<typeof mahasiswaEditSchema>, unknown, MahasiswaEditValues>({
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
    reset({ nim: student.nim, name: student.nama, email: student.email, username: student.nim, password: "", gender, nik: student.nik ?? "", birthPlace: student.tempatLahir ?? "", phoneNumber: student.noHp ?? "", address: student.alamat ?? "", birthDate, angkatan: student.angkatan, semester: student.summary.semester, status: student.status ?? "Aktif", fakultasId: facultyId, prodiId: Number(student.prodi?.id ?? 0), dosenId: student.dosenPembimbing?.id ?? "" })
    setPhotoChanged(false)
    setAvatarKey(undefined)
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

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { toast.error("Foto harus berupa gambar dengan ukuran maksimal 5 MB"); return }
    setPhotoPreview(URL.createObjectURL(file))
    if (!id) return
    setUploadingPhoto(true)
    try {
      const { uploadUrl, key } = await dispatch(getStudentAvatarUploadUrl({ id, contentType: file.type })).unwrap()
      const uploadResponse = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })
      if (!uploadResponse.ok) throw new Error("Upload foto gagal")
      setAvatarKey(key)
      setPhotoChanged(true)
      toast.success("Foto siap disimpan")
    } catch { toast.error("Gagal mengunggah foto") } finally { setUploadingPhoto(false) }
  }

  const onSubmit = async (values: MahasiswaEditValues) => {
    if (!id) return
    setIsSaving(true)
    try {
      await dispatch(updateStudent({ id, payload: { name: values.name, email: values.email, nik: values.nik, birthPlace: values.birthPlace, phoneNumber: values.phoneNumber, address: values.address, birthDate: values.birthDate?.toISOString().split("T")[0], gender: values.gender, nim: values.nim, angkatan: values.angkatan, semester: values.semester, status: values.status, prodiId: values.prodiId, dosenId: values.dosenId, ...(avatarKey ? { avatarKey } : {}) } })).unwrap()
      await dispatch(getStudentById(id))
      toast.success("Data mahasiswa berhasil diperbarui")
      leavePage()
    } catch (error) { toast.error(String(error)) } finally { setIsSaving(false) }
  }

  if (!studentDetail) return <main className="mx-auto max-w-4xl p-6">Memuat data mahasiswa...</main>
  const student = studentDetail.student
  const initials = student.nama.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()

  return <>
    <main className="mx-auto w-full max-w-6xl space-y-5 py-5 pb-6 sm:py-7">
      <button type="button" onClick={handleBack} className="group inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Kembali ke Detail Mahasiswa</button>
      <header className="border-b pb-5"><p className="text-sm font-medium text-primary">Data Mahasiswa</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Edit Mahasiswa</h1><p className="mt-1 text-sm text-muted-foreground">Perbarui informasi mahasiswa dengan data terbaru.</p></header>

      <Card><CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-start"><div className="relative flex size-24 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-2xl font-semibold text-primary">{photoPreview ? <img src={photoPreview} alt="Pratinjau foto mahasiswa" className="size-full object-cover" /> : initials}<span className="absolute inset-0 rounded-full ring-1 ring-inset ring-border" /></div><div className="text-center sm:text-left"><p className="font-medium">Foto Mahasiswa</p><p className="mt-1 text-xs text-muted-foreground">JPG, PNG, atau WebP. Maksimal 5 MB.</p><input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} className="sr-only" /><Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto}>{uploadingPhoto ? <Loader2 className="animate-spin" /> : <Camera />} {uploadingPhoto ? "Mengunggah..." : "Ubah Foto"}</Button></div></CardContent></Card>

      <form id="student-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>Data Identitas</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
          <FormField label="NIM"><Input {...register("nim")} disabled className="bg-muted" /></FormField>
          <FormField label="Nama Lengkap" error={errors.name?.message}><Input {...register("name")} /></FormField>
          <FormField label="NIK" error={errors.nik?.message}><Input {...register("nik")} /></FormField>
          <FormField label="Jenis Kelamin" error={errors.gender?.message}><select {...register("gender")} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Pilih jenis kelamin</option>{genderOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></FormField>
          <FormField label="Tempat Lahir" error={errors.birthPlace?.message}><Input {...register("birthPlace")} /></FormField>
          <FormField label="Tanggal Lahir" error={errors.birthDate?.message}><Input type="date" {...register("birthDate", { valueAsDate: true })} /></FormField>
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Kontak</CardTitle></CardHeader><CardContent className="grid gap-5"><FormField label="Email" error={errors.email?.message}><Input type="email" {...register("email")} /></FormField><FormField label="No. HP" error={errors.phoneNumber?.message}><Input {...register("phoneNumber")} /></FormField><FormField label="Alamat" error={errors.address?.message}><textarea {...register("address")} rows={4} className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50" /></FormField></CardContent></Card>

        <Card><CardHeader><CardTitle>Data Akademik</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
          <FormField label="Fakultas" error={errors.fakultasId?.message}><select {...register("fakultasId", { valueAsNumber: true })} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value={0}>Pilih Fakultas</option>{fakultas.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
          <FormField label="Program Studi" error={errors.prodiId?.message}><select {...register("prodiId", { valueAsNumber: true })} disabled={!fakultasId} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:bg-muted"><option value={0}>Pilih Program Studi</option>{prodi.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></FormField>
          <FormField label="Angkatan" error={errors.angkatan?.message}><Input type="number" {...register("angkatan", { valueAsNumber: true })} /></FormField>
          <FormField label="Dosen Pembimbing Akademik" error={errors.dosenId?.message}><select {...register("dosenId")} disabled={!prodiId} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm disabled:cursor-not-allowed disabled:bg-muted"><option value="">Pilih Dosen PA</option>{lecturers.map((item) => <option key={item.dosen.id} value={item.dosen.id}>{item.name}</option>)}</select></FormField>
          <div className="space-y-2"><Label>Status Mahasiswa</Label><div className="flex items-center gap-3"><Badge variant="secondary" className="px-3 py-1">{selectedStatus}</Badge><Button type="button" variant="outline" size="sm" onClick={() => { setPendingStatus(selectedStatus); setStatusDialogOpen(true) }}>Ubah Status <ChevronDown /></Button></div></div>
        </CardContent></Card>
      </form>

      <div className="sticky bottom-4 z-20 rounded-xl border bg-background p-3 shadow-lg shadow-black/5 supports-backdrop-filter:bg-background/90 supports-backdrop-filter:backdrop-blur-md sm:p-4"><div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">{isDirty || photoChanged ? "Perubahan belum disimpan" : "Belum ada perubahan"}</p><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={handleBack}>Batal</Button><Button type="submit" form="student-edit-form" disabled={(!isDirty && !photoChanged) || isSaving || uploadingPhoto}>{isSaving ? <Loader2 className="animate-spin" /> : <Check />} {isSaving ? "Menyimpan..." : "Simpan Perubahan"}</Button></div></div></div>
    </main>

    <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}><DialogContent><DialogHeader><DialogTitle>Ubah Status Mahasiswa</DialogTitle><DialogDescription>Perubahan status akan dicatat sebagai bagian dari pembaruan data.</DialogDescription></DialogHeader><div className="space-y-4"><div className="rounded-lg bg-muted/50 px-3 py-2 text-sm"><span className="text-muted-foreground">Status Saat Ini</span><p className="mt-1 font-semibold">{student.status ?? "-"}</p></div><FormField label="Status Baru"><select value={pendingStatus} onChange={(event) => setPendingStatus(event.target.value)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></FormField><FormField label="Alasan"><textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} rows={3} placeholder="Pengajuan cuti semester..." className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm" /></FormField></div><DialogFooter><Button type="button" variant="outline" onClick={() => setStatusDialogOpen(false)}>Batal</Button><Button type="button" onClick={() => { setValue("status", pendingStatus as MahasiswaEditValues["status"], { shouldDirty: true, shouldValidate: true }); setStatusDialogOpen(false) }}>Ubah Status</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={confirmLeaveOpen} onOpenChange={setConfirmLeaveOpen}><DialogContent><DialogHeader><DialogTitle>Perubahan belum disimpan</DialogTitle><DialogDescription>Anda memiliki perubahan yang belum disimpan. Yakin ingin keluar?</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setConfirmLeaveOpen(false)}>Tetap Edit</Button><Button type="button" variant="destructive" onClick={leavePage}>Buang Perubahan</Button></DialogFooter></DialogContent></Dialog>
  </>
}
