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
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getAllFakultas, getAllProdi } from "@/features/action/campusThunk"
import { createStudent, getAllLecturers, getAvatarUploadUrl } from "@/features/action/usersThunk"
import { MahasiswaField } from "./mahasiswa-form"

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",")
  const mimeMatch = header.match(/data:(.*?);base64/)
  const mime = mimeMatch ? mimeMatch[1] : "image/png"
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

const initialFormData = {
  name: "", email: "", username: "", password: "",
  gender: "", phoneNumber: "", address: "",
  nim: "", angkatan: "", semester: "", status: "",
}

export function DialogForm() {
  const dispatch = useAppDispatch()
  const { fakultas, prodi } = useAppSelector((state) => state.campus)
  const { lecturers } = useAppSelector((state) => state.users)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

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

  useEffect(() => {
    dispatch(getAllFakultas())
  }, [dispatch])

  useEffect(() => {
    setSelectedProdiId(null)
    setSelectedDosenId(null)
    if (selectedFakultasId) {
      dispatch(getAllProdi({ fakultasId: selectedFakultasId }))
    }
  }, [selectedFakultasId, dispatch])

  useEffect(() => {
    setSelectedDosenId(null)
    if (selectedProdiId) {
      dispatch(getAllLecturers({ prodiId: selectedProdiId }))
    }
  }, [selectedProdiId, dispatch])

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
    setFormData(initialFormData)
    setSelectedFakultasId(null)
    setSelectedProdiId(null)
    setSelectedDosenId(null)
    setDate(undefined)
    setIsConfirmed(false)
    setSelectedFile(null)
    setCroppedImage(null)
    setSubmitError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    console.log("MASUK NIH");


    if (!selectedProdiId) {
      setSubmitError("Program Studi wajib dipilih.")
      return
    }
    if (!selectedDosenId) {
      setSubmitError("Dosen Wali wajib dipilih.")
      return
    }

    setIsSubmitting(true)
    try {
      let avatarKey: string | undefined

      if (croppedImage) {
        const blob = dataUrlToBlob(croppedImage)
        const contentType = blob.type || "image/png"

        const { uploadUrl, key } = await dispatch(getAvatarUploadUrl(contentType)).unwrap()

        const putResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: blob,
        })
        console.log(putResponse, '<<<<<');

        if (!putResponse.ok) {
          throw new Error("Upload foto ke storage gagal. Coba upload ulang.")
        }
        avatarKey = key
      }

      await dispatch(
        createStudent({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          gender: formData.gender,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          birthDate: date ? date.toISOString() : undefined,
          nim: formData.nim,
          angkatan: Number(formData.angkatan),
          semester: Number(formData.semester),
          status: formData.status,
          prodiId: selectedProdiId,
          dosenId: selectedDosenId,
          avatarKey,
        })
      ).unwrap()

      resetForm()
      setDialogOpen(false)
    } catch (err: any) {
      setSubmitError(typeof err === "string" ? err : err?.message ?? "Terjadi kesalahan, coba lagi.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <form id="mahasiswa-form" onSubmit={handleSubmit}>
        <DialogTrigger render={<Button variant="outline" type="button">Add Mahasiswa</Button>} />
        <DialogContent className="sm:max-w-sm flex max-h-[85vh] flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Add Mahasiswa</DialogTitle>
            <DialogDescription>
              Isi data mahasiswa baru di bawah ini. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 mb-5">
            <MahasiswaField
              formData={formData}
              setFormData={setFormData}
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
            />
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose render={<Button variant="outline" type="button">Cancel</Button>} />
            <Button type="submit" form="mahasiswa-form" disabled={!isConfirmed || isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}