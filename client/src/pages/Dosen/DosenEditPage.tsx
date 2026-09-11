import { useEffect, useRef, useState, type ReactNode } from "react"
import { useBlocker, useNavigate, useParams } from "react-router-dom"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Check, FilePenLine, GraduationCap, Info, Loader2, Mail, UserRound } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useCampusOptions } from "@/hooks/use-campus-options"
import { getLecturerById, updateLecturer } from "@/features/action/dosenThunk"
import { dosenEditSchema, type DosenEditValues, type UpdateLecturerPayload } from "@/schemas/dosen-edit.schema"
import type { LecturerDetailResponse } from "@/types/lecturer-detail"
import { LecturerPhotoEditor } from "@/components/dosen-detail/lecturer-photo-editor"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TabSkeleton } from "@/components/dosen-detail/remote-tab"

export default function DosenEditPage() {
  const { id } = useParams()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { lecturerDetail, isLoadingLecturerDetail, lecturerDetailError } = useAppSelector((state) => state.lecturers)
  useEffect(() => {
    if (!id) return
    const request = dispatch(getLecturerById(id))
    return () => request.abort()
  }, [dispatch, id])
  if (!id || lecturerDetailError) return <main className="mx-auto max-w-6xl space-y-4 py-7"><Button variant="ghost" onClick={() => navigate("/dosen")}><ArrowLeft /> Daftar Dosen</Button><p role="alert">{lecturerDetailError ?? "ID dosen tidak tersedia."}</p>{id && <Button variant="outline" onClick={() => dispatch(getLecturerById(id))}>Coba Lagi</Button>}</main>
  if (isLoadingLecturerDetail || !lecturerDetail || lecturerDetail.id !== id) return <main className="mx-auto w-full max-w-6xl py-7"><TabSkeleton /></main>
  return <DosenEditForm key={lecturerDetail.id} lecturer={lecturerDetail} />
}

function SectionCard({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return <Card id={id} className="scroll-mt-22 rounded-2xl [--card-spacing:--spacing(6)]"><CardHeader className="border-b"><CardTitle><h2>{title}</h2></CardTitle><p className="text-sm text-muted-foreground">{description}</p></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">{children}</CardContent></Card>
}

function DosenEditForm({ lecturer }: { lecturer: LecturerDetailResponse["lecturer"] }) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isSaving = useAppSelector((state) => state.lecturers.isUpdatingLecturer)
  const allowLeave = useRef(false)
  const saveLock = useRef(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const { register, control, setValue, handleSubmit, reset, formState: { errors, isDirty, dirtyFields } } = useForm<DosenEditValues>({
    resolver: zodResolver(dosenEditSchema),
    mode: "onBlur",
    defaultValues: { name: lecturer.nama, nidn: lecturer.nidn ?? "", email: lecturer.email, gender: lecturer.jenisKelamin === "Laki-laki" ? "Male" : lecturer.jenisKelamin === "Perempuan" ? "Female" : "", birthDate: lecturer.tanggalLahir ?? "", phoneNumber: lecturer.noHp ?? "", address: lecturer.alamat ?? "", fakultasId: lecturer.fakultas?.id ?? 0, prodiId: lecturer.prodi?.id ?? 0 },
  })
  const hasChanges = isDirty || photo !== null
  const facultyId = useWatch({ control, name: "fakultasId" })
  const faculties = useCampusOptions("fakultas")
  const programs = useCampusOptions("prodi", facultyId)
  const blocker = useBlocker(() => !allowLeave.current && (hasChanges || saveLock.current))
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (hasChanges && !allowLeave.current) { event.preventDefault(); event.returnValue = "" } }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [hasChanges])
  const goBack = () => {
    if (typeof window.history.state?.idx === "number" && window.history.state.idx > 0) navigate(-1)
    else navigate(`/dosen/${lecturer.id}`)
  }
  const submit = async (values: DosenEditValues) => {
    if (saveLock.current || !hasChanges) return
    saveLock.current = true
    const payload: UpdateLecturerPayload = {}
    for (const key of ["name", "nidn", "email", "phoneNumber", "address"] as const) {
      if (dirtyFields[key]) payload[key] = values[key]
    }
    if (dirtyFields.prodiId) payload.prodiId = values.prodiId
    if (dirtyFields.gender && values.gender) payload.gender = values.gender
    if (dirtyFields.birthDate) payload.birthDate = values.birthDate ? `${values.birthDate}T00:00:00.000Z` : null
    try {
      await dispatch(updateLecturer({ id: lecturer.id, payload, photo })).unwrap()
      allowLeave.current = true
      reset(values)
      navigate(`/dosen/${lecturer.id}`, { replace: true })
    } catch {
      // Satu toast loading/sukses/gagal dikelola middleware Redux.
    } finally { saveLock.current = false }
  }
  const selectClass = "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50"
  return <main className="mx-auto w-full max-w-7xl space-y-6 py-5 sm:py-7">
    <Button variant="ghost" disabled={isSaving} className="-ml-2 text-muted-foreground" onClick={goBack}><ArrowLeft /> Kembali</Button>
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-card p-5 sm:p-7"><div className="flex items-start gap-4"><span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FilePenLine className="size-5" /></span><div><p className="text-sm font-medium text-primary">Data Dosen</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Edit Dosen</h1><p className="mt-1 text-sm text-muted-foreground">Perbarui identitas, kontak, dan penempatan akademik dosen.</p></div></div><Badge variant="outline" className="gap-2 rounded-full px-3 py-1.5"><span className={`size-2 rounded-full ${hasChanges ? "bg-amber-500" : "bg-emerald-500"}`} />{hasChanges ? "Ada perubahan" : "Data tersimpan"}</Badge></header>
    <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 lg:sticky lg:top-22"><Card className="rounded-2xl"><CardContent className="flex flex-col items-center pt-4 text-center"><LecturerPhotoEditor name={lecturer.nama} avatarUrl={lecturer.avatarUrl} preview={photo} disabled={isSaving} onChange={setPhoto} /><h2 className="mt-4 break-words text-lg font-semibold">{lecturer.nama}</h2><p className="mt-1 text-sm text-muted-foreground">NIDN {lecturer.nidn ?? "—"}</p><p className="mt-3 text-sm text-muted-foreground">{lecturer.prodi?.nama ?? "Program studi belum tersedia"}</p></CardContent></Card><nav aria-label="Bagian form dosen" className="rounded-2xl border bg-card p-2">{[{ id: "identitas", label: "Data identitas", icon: UserRound }, { id: "kontak", label: "Informasi kontak", icon: Mail }, { id: "akademik", label: "Data akademik", icon: GraduationCap }].map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-primary/5 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring" onClick={(event) => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }) }}><Icon className="size-4" />{label}</a>)}</nav><p className="flex gap-2 rounded-xl bg-muted/40 p-4 text-xs leading-relaxed text-muted-foreground"><Info className="size-4 shrink-0" />Periksa data sebelum menyimpan. Field bertanda * wajib diisi.</p></aside>
      <form id="lecturer-edit-form" className="min-w-0" onSubmit={(event) => { void handleSubmit(submit)(event) }}><fieldset disabled={isSaving} className="min-w-0 space-y-6">
        <SectionCard id="identitas" title="Data Identitas" description="Gunakan identitas resmi dosen.">
          <Field data-invalid={!!errors.name}><FieldLabel htmlFor="name">Nama lengkap dan gelar *</FieldLabel><Input id="name" autoComplete="name" {...register("name")} aria-invalid={!!errors.name} /><FieldError>{errors.name?.message}</FieldError></Field>
          <Field data-invalid={!!errors.nidn}><FieldLabel htmlFor="nidn">NIDN *</FieldLabel><Input id="nidn" inputMode="numeric" maxLength={20} {...register("nidn")} aria-invalid={!!errors.nidn} /><FieldError>{errors.nidn?.message}</FieldError></Field>
          <Field><FieldLabel htmlFor="gender">Jenis kelamin</FieldLabel><select id="gender" className={selectClass} {...register("gender")}><option value="" disabled>Pilih jenis kelamin</option><option value="Male">Laki-laki</option><option value="Female">Perempuan</option></select></Field>
          <Field data-invalid={!!errors.birthDate}><FieldLabel htmlFor="birthDate">Tanggal lahir</FieldLabel><Input id="birthDate" type="date" {...register("birthDate")} aria-invalid={!!errors.birthDate} /><FieldError>{errors.birthDate?.message}</FieldError></Field>
          <div className="sm:col-span-2"><p className="text-xs text-muted-foreground">Tempat lahir</p><p className="mt-1 text-sm">{lecturer.tempatLahir ?? "—"}</p></div>
        </SectionCard>
        <SectionCard id="kontak" title="Informasi Kontak" description="Pastikan email dan nomor telepon dapat dihubungi.">
          <Field data-invalid={!!errors.email}><FieldLabel htmlFor="email">Email *</FieldLabel><Input id="email" type="email" autoComplete="email" {...register("email")} aria-invalid={!!errors.email} /><FieldError>{errors.email?.message}</FieldError></Field>
          <Field data-invalid={!!errors.phoneNumber}><FieldLabel htmlFor="phoneNumber">Nomor telepon</FieldLabel><Input id="phoneNumber" type="tel" autoComplete="tel" {...register("phoneNumber")} aria-invalid={!!errors.phoneNumber} /><FieldError>{errors.phoneNumber?.message}</FieldError></Field>
          <Field className="sm:col-span-2" data-invalid={!!errors.address}><FieldLabel htmlFor="address">Alamat</FieldLabel><textarea id="address" rows={3} autoComplete="street-address" {...register("address")} aria-invalid={!!errors.address} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring" /><FieldError>{errors.address?.message}</FieldError></Field>
        </SectionCard>
        <SectionCard id="akademik" title="Data Akademik" description="Pilih fakultas untuk menampilkan program studi yang sesuai.">
          <Field data-invalid={!!errors.fakultasId}><FieldLabel htmlFor="fakultasId">Fakultas *</FieldLabel><select id="fakultasId" className={selectClass} disabled={faculties.loading} {...register("fakultasId", { valueAsNumber: true, onChange: () => setValue("prodiId", 0, { shouldDirty: true, shouldValidate: true }) })} aria-invalid={!!errors.fakultasId}><option value={0}>{faculties.loading ? "Memuat fakultas..." : "Pilih fakultas"}</option>{lecturer.fakultas && !faculties.options.some((item) => Number(item.id) === lecturer.fakultas?.id) && <option value={lecturer.fakultas.id}>{lecturer.fakultas.nama}</option>}{faculties.options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><FieldError>{errors.fakultasId?.message}</FieldError>{faculties.error && <div role="alert" className="text-xs text-destructive">{faculties.error}<Button type="button" variant="ghost" size="sm" onClick={faculties.retry}>Coba Lagi</Button></div>}</Field>
          <Field data-invalid={!!errors.prodiId}><FieldLabel htmlFor="prodiId">Program studi *</FieldLabel><select id="prodiId" className={selectClass} disabled={!facultyId || programs.loading} {...register("prodiId", { valueAsNumber: true })} aria-invalid={!!errors.prodiId}><option value={0}>{programs.loading ? "Memuat program studi..." : "Pilih program studi"}</option>{facultyId === lecturer.fakultas?.id && lecturer.prodi && !programs.options.some((item) => Number(item.id) === lecturer.prodi?.id) && <option value={lecturer.prodi.id}>{lecturer.prodi.nama}</option>}{programs.options.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><FieldError>{errors.prodiId?.message}</FieldError>{programs.error && <div role="alert" className="text-xs text-destructive">{programs.error}<Button type="button" variant="ghost" size="sm" onClick={programs.retry}>Coba Lagi</Button></div>}</Field>
          <div><p className="text-xs text-muted-foreground">Pendidikan terakhir</p><p className="mt-1 text-sm">{lecturer.pendidikanTerakhir ?? "—"}</p></div><div><p className="text-xs text-muted-foreground">Bidang keahlian</p><p className="mt-1 text-sm">{lecturer.bidangKeahlian ?? "—"}</p></div>
        </SectionCard>
      </fieldset></form>
    </div>
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 p-4 shadow-lg backdrop-blur"><p role="status" className="text-xs text-muted-foreground">{isSaving ? (photo ? "Mengunggah foto dan menyimpan data..." : "Menyimpan data dosen...") : hasChanges ? "Perubahan belum disimpan" : "Belum ada perubahan"}</p><div className="flex gap-3"><Button variant="outline" disabled={isSaving} onClick={goBack}>Batal</Button><Button type="submit" form="lecturer-edit-form" disabled={!hasChanges || isSaving || faculties.loading || programs.loading}>{isSaving ? <Loader2 className="animate-spin" /> : <Check />}{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</Button></div></div>
    <Dialog open={blocker.state === "blocked"} onOpenChange={(open) => { if (!open && blocker.state === "blocked") blocker.reset() }}><DialogContent showCloseButton={!isSaving}><DialogHeader><DialogTitle>{isSaving ? "Data sedang disimpan" : "Perubahan belum disimpan"}</DialogTitle><DialogDescription>{isSaving ? "Tunggu hingga penyimpanan selesai." : "Keluar dari halaman akan membuang perubahan yang belum disimpan."}</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => blocker.state === "blocked" && blocker.reset()}>Tetap Edit</Button>{!isSaving && <Button variant="destructive" onClick={() => blocker.state === "blocked" && blocker.proceed()}>Buang Perubahan</Button>}</DialogFooter></DialogContent></Dialog>
  </main>
}
