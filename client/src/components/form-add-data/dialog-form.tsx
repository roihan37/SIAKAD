import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react"
import { useLocation } from "react-router"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { createFakultas, createProdi, getAllFakultas, getAllProdi } from "@/features/action/campusThunk"
import { createLecturer, createStudent, getAllLecturers, getAvatarUploadUrl, getLecturerAvatarUploadUrl } from "@/features/action/usersThunk"
import { createMatkul } from "@/features/action/matkulThunk"
import { MahasiswaField } from "./mahasiswa-form"
import { DosenField } from "./dosen-form"
import { FakultasField } from "./fakultas-form"
import { ProdiField } from "./prodi-form"
import { MatkulField } from "./matkul-form"
import { AlertDestructive } from "../alert-form"
import RuanganField from "./ruangan-form"
import { createRuangan } from "@/features/action/ruanganThunk"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import {
  fakultasSchema,
  prodiSchema,
  matkulSchema,
  ruanganSchema,
  dosenSchema,
  mahasiswaSchema,
  type RuanganFormValues,
  type RuanganFormInput,
  type MahasiswaFormInput,
  type MahasiswaFormValues,
  type DosenFormInput,
  type DosenFormValues,
  type FakultasFormInput,
  type FakultasFormValues,
  type ProdiFormValues,
  type ProdiFromInput,
  type MatkulFormValues,
  type MatkulFormInput,
} from "@/schemas"



// Utility: convert a base64 data URL to a Blob for uploading images
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",")
  const mimeMatch = header.match(/data:(.*?);base64/)
  const mime = mimeMatch ? mimeMatch[1] : "image/png"
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

// -----------------------------
// Initial form templates (used to reset component state)
// Keep these minimal and serializable
// -----------------------------

const initialMatkulFormData = { kode: "", name_mk: "", sks: "3", semester: "1" }

export function DialogForm() {
  const { pathname } = useLocation()

  

  const dosenForm = useForm<
    DosenFormInput,
    unknown,
    DosenFormValues
  >({
    resolver: zodResolver(dosenSchema),

    mode: "onChange",

    defaultValues: {
      nidn: "",
      name: "",
      email: "",
      username: "",
      password: "",
      gender: undefined,
      phoneNumber: "",
      address: "",
      birthDate: undefined,
      status: "Aktif",
      jabatan: "Dosen",
      fakultasId: 0,
      prodiId: 0,
    },
  })

  const fakultasForm = useForm<
    FakultasFormInput,
    unknown,
    FakultasFormValues
  >({
    resolver: zodResolver(fakultasSchema),
    mode: "onChange",
    defaultValues: {
      kode: "",
      name: "",
    },
  })

  const prodiForm = useForm<
    ProdiFromInput,
    unknown,
    ProdiFormValues
  >({
    resolver: zodResolver(prodiSchema),
    mode: "onChange",
    defaultValues: {
      kode: "",
      name: "",
    },
  })

  const ruanganForm = useForm<
    RuanganFormInput,
    unknown,
    RuanganFormValues
  >({
    resolver: zodResolver(ruanganSchema),
    mode: "onChange",
    defaultValues: {
      kode: "",
      nama: "",
      kapasitas: 0,
      gedung: "",
    },
  })





  // Route detection: which page we're on determines the dialog form
  const isFakultas = pathname.startsWith("/fakultas")
  const isProdi = pathname.startsWith("/program-studi") || pathname.startsWith("/prodi")
  const isLecturer = pathname.startsWith("/dosen")
  const isMatkul = pathname.startsWith("/mata-kuliah")
  const isRuangan = pathname.startsWith("/ruangan")

  // Labels used in UI (title, button text, and form id)
  const entityName = isFakultas ? "Fakultas" : isLecturer ? "Dosen" : isProdi ? "Prodi" : isMatkul ? "Mata Kuliah" : isRuangan ? "Ruangan" : "Mahasiswa"
  const entityNameLower = isFakultas ? "fakultas" : isLecturer ? "dosen" : isProdi ? "prodi" : isMatkul ? "mata-kuliah" : isRuangan ? "ruangan" : "mahasiswa"

  const dispatch = useAppDispatch()
  const { fakultas, prodi } = useAppSelector((state) => state.campus)
  const { lecturers } = useAppSelector((state) => state.users)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [matkulFormData, setMatkulFormData] = useState(initialMatkulFormData)

  const [selectedFakultasId, setSelectedFakultasId] = useState<number | null>(null)
  const [selectedProdiId, setSelectedProdiId] = useState<number | null>(null)
  const [selectedDosenId, setSelectedDosenId] = useState<string | null>(null)

  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isConfirmed, setIsConfirmed] = useState(false)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [croppedImage, setCroppedImage] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Load fakultas once so dependent selects (prodi) are available
  useEffect(() => {
    dispatch(getAllFakultas())
  }, [dispatch])

  useEffect(() => {
    setSelectedProdiId(null)
    if (!isLecturer && !isFakultas) setSelectedDosenId(null)
    if (!isFakultas && selectedFakultasId) {
      dispatch(getAllProdi({ fakultasId: selectedFakultasId }))
    }
  }, [selectedFakultasId, dispatch, isLecturer, isFakultas])

  useEffect(() => {
    setSelectedDosenId(null)
    if (!isLecturer && !isFakultas && selectedProdiId) {
      dispatch(getAllLecturers({ prodiId: selectedProdiId }))
    }
  }, [selectedProdiId, dispatch, isLecturer, isFakultas])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setCroppedImage(null)
    }
  }

  const handleResetPhoto = () => {
    setSelectedFile(null)
    setCroppedImage(null)
  }

  const resetForm = () => {
    setMatkulFormData(initialMatkulFormData)

    ruanganForm.reset()
    // studentForm.reset()
    dosenForm.reset()
    fakultasForm.reset()
    prodiForm.reset()

    setSelectedFakultasId(null)
    setSelectedProdiId(null)
    setSelectedDosenId(null)
    setDate(undefined)
    setIsConfirmed(false)
    setSelectedFile(null)
    setCroppedImage(null)
    setSubmitError(null)
    setFieldErrors({})
  }

  const submitStudent = async (
    data: MahasiswaFormValues
  ) => {
    try {
      setIsSubmitting(true)

      let avatarKey: string | undefined

      if (croppedImage) {
        const blob = dataUrlToBlob(croppedImage)
        const contentType = blob.type || "image/png"

        const {
          uploadUrl,
          key,
        } = await dispatch(
          getAvatarUploadUrl(contentType)
        ).unwrap()

        const response = await fetch(
          uploadUrl,
          {
            method: "PUT",
            headers: {
              "Content-Type": contentType,
            },
            body: blob,
          }
        )

        if (!response.ok) {
          throw new Error(
            "Upload foto ke storage gagal. Coba upload ulang."
          )
        }

        avatarKey = key
      }

      await dispatch(
        createStudent({
          ...data,
          birthDate: data.birthDate?.toISOString(),
          avatarKey,
        })
      ).unwrap()

      resetForm()
      setSelectedFile(null)
      setCroppedImage(null)
      setDialogOpen(false)
    } catch (error: any) {
      setSubmitError(
        error?.message ??
        "Terjadi kesalahan, coba lagi."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitDosen = async (
    data: DosenFormValues
  ) => {
    try {
      setIsSubmitting(true)

      let avatarKey: string | undefined

      if (croppedImage) {
        const blob = dataUrlToBlob(croppedImage)
        const contentType = blob.type || "image/png"

        const {
          uploadUrl,
          key,
        } = await dispatch(
          getAvatarUploadUrl(contentType)
        ).unwrap()

        const response = await fetch(
          uploadUrl,
          {
            method: "PUT",
            headers: {
              "Content-Type": contentType,
            },
            body: blob,
          }
        )

        if (!response.ok) {
          throw new Error(
            "Upload foto ke storage gagal. Coba upload ulang."
          )
        }

        avatarKey = key
      }

      await dispatch(
        createLecturer({
          ...data,
          birthDate: data.birthDate?.toISOString(),
          avatarKey,
        })
      ).unwrap()

      resetForm()
      setSelectedFile(null)
      setCroppedImage(null)
      setDialogOpen(false)
    } catch (error: any) {
      setSubmitError(
        error?.message ??
        "Terjadi kesalahan, coba lagi."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitRuangan = async (
    data: RuanganFormValues
  ) => {
    setSubmitError(null)

    try {
      setIsSubmitting(true)

      await dispatch(
        createRuangan(data)
      ).unwrap()

      ruanganForm.reset()
      setDialogOpen(false)
    } catch (err: any) {
      setSubmitError(
        typeof err === "string"
          ? err
          : err?.message ?? "Terjadi kesalahan, coba lagi."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitFakultas = async (
    data: FakultasFormValues
  ) => {
    setSubmitError(null)

    try {
      setIsSubmitting(true)

      await dispatch(
        createFakultas(data)
      ).unwrap()

      resetForm()
      setDialogOpen(false)
    } catch (err: any) {
      setSubmitError(
        typeof err === "string"
          ? err
          : err?.message ?? "Terjadi kesalahan, coba lagi."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitProdi = async (
    data: ProdiFormValues
  ) => {
    setSubmitError(null)

    try {
      setIsSubmitting(true)

      await dispatch(
        createProdi(data)
      ).unwrap()

      resetForm()
      setDialogOpen(false)
    } catch (err: any) {
      setSubmitError(
        typeof err === "string"
          ? err
          : err?.message ?? "Terjadi kesalahan, coba lagi."
      )
    } finally {
      setIsSubmitting(false)
    }
  }


  



  return (
    // <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
    // <form id={`${entityNameLower}-form`} onSubmit={handleSubmit}>
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger render={<Button variant="outline" type="button">Add {entityName}</Button>} />
      <DialogContent className="sm:max-w-sm flex max-h-[85vh] flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Add {entityName}</DialogTitle>
          <DialogDescription>
            Isi data {entityNameLower} baru di bawah ini. Klik simpan jika sudah selesai.
          </DialogDescription>
          {submitError && <AlertDestructive title={submitError} />}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 mb-5">
          {
            isFakultas ? <FakultasField
              form={fakultasForm}
              onSubmit={submitFakultas}
              isConfirmed={isConfirmed}
              setIsConfirmed={setIsConfirmed}
            />

              : isProdi ? <ProdiField
                form={prodiForm}
                onSubmit={submitProdi}
                fakultas={fakultas}
                selectedFakultasId={selectedFakultasId}
                setSelectedFakultasId={setSelectedFakultasId}
                isConfirmed={isConfirmed}
                setIsConfirmed={setIsConfirmed}
                errors={fieldErrors}
              />

                : isMatkul ? <MatkulField
                  formData={matkulFormData}
                  setFormData={setMatkulFormData}
                  prodi={prodi}
                  selectedProdiId={selectedProdiId}
                  setSelectedProdiId={setSelectedProdiId}
                  isConfirmed={isConfirmed}
                  setIsConfirmed={setIsConfirmed}
                  errors={fieldErrors}
                />

                  : isLecturer ? <DosenField
                    form={dosenForm}
                    onSubmit={submitDosen}
                    fakultas={fakultas}
                    prodi={prodi}
                    selectedFakultasId={selectedFakultasId}
                    setSelectedFakultasId={setSelectedFakultasId}
                    selectedProdiId={selectedProdiId}
                    setSelectedProdiId={setSelectedProdiId}
                    date={date}
                    setDate={setDate}
                    open={open}
                    setOpen={setOpen}
                    selectedFile={selectedFile}
                    croppedImage={croppedImage}
                    onFileChange={handleFileChange}
                    onResetPhoto={handleResetPhoto}
                    onCropped={setCroppedImage}
                    isConfirmed={isConfirmed}
                    setIsConfirmed={setIsConfirmed}
                    submitError={submitError}
                    errors={fieldErrors}
                  />

                    : isRuangan ? (
                      <RuanganField
                        form={ruanganForm}
                        onSubmit={submitRuangan}
                        isConfirmed={isConfirmed}
                        setIsConfirmed={setIsConfirmed}
                      />
                    )

                      : <MahasiswaField
                        onSubmit={submitStudent}
                        fakultas={fakultas}
                        prodi={prodi}
                        lecturers={lecturers}
                        selectedFakultasId={selectedFakultasId}
                        setSelectedFakultasId={setSelectedFakultasId}
                        selectedProdiId={selectedProdiId}
                        setSelectedProdiId={setSelectedProdiId}
                        selectedDosenId={selectedDosenId}
                        setSelectedDosenId={setSelectedDosenId}
                        date={date}
                        setDate={setDate}
                        open={open}
                        setOpen={setOpen}
                        selectedFile={selectedFile}
                        croppedImage={croppedImage}
                        onFileChange={handleFileChange}
                        onResetPhoto={handleResetPhoto}
                        onCropped={setCroppedImage}
                        isConfirmed={isConfirmed}
                        setIsConfirmed={setIsConfirmed}
                        submitError={submitError}
                        errors={fieldErrors}
                      />}


        </div>
        <DialogFooter className="p-6 pt-4 border-t">
          <DialogClose
            render={
              <Button
                variant="outline"
                type="button"
              >
                Cancel
              </Button>
            }
          />

          <Button
            type="submit"
            form={`${entityNameLower}-form`}
            disabled={!isConfirmed || isSubmitting}
          >
            {isSubmitting
              ? "Menyimpan..."
              : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
      {/* </form> */}
    </Dialog>
  )
}
