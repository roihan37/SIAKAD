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
const initialStudentFormData = {
  name: "", email: "", username: "", password: "",
  gender: "", phoneNumber: "", address: "",
  nim: "", angkatan: "", semester: "", status: "",
}

const initialLecturerFormData = {
  name: "", email: "", username: "", password: "",
  gender: "", phoneNumber: "", address: "",
  nidn: "", status: "", jabatan: "",
}

const initialFakultasFormData = { kode: "", name: "" }
const initialProdiFormData = { kode: "", name: "" }
const initialMatkulFormData = { kode: "", name_mk: "", sks: "3", semester: "1" }

export function DialogForm() {
  const { pathname } = useLocation()

  // Route detection: which page we're on determines the dialog form
  const isFakultas = pathname.startsWith("/fakultas")
  const isProdi = pathname.startsWith("/program-studi") || pathname.startsWith("/prodi")
  const isLecturer = pathname.startsWith("/dosen")
  const isMatkul = pathname.startsWith("/mata-kuliah")

  // Labels used in UI (title, button text, and form id)
  const entityName = isFakultas ? "Fakultas" : isLecturer ? "Dosen" : isProdi ? "Prodi" : isMatkul ? "Mata Kuliah" : "Mahasiswa"
  const entityNameLower = isFakultas ? "fakultas" : isLecturer ? "dosen" : isProdi ? "prodi" : isMatkul ? "mata-kuliah" : "mahasiswa"
  
  const dispatch = useAppDispatch()
  const { fakultas, prodi } = useAppSelector((state) => state.campus)
  const { lecturers } = useAppSelector((state) => state.users)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [studentFormData, setStudentFormData] = useState(initialStudentFormData)
  const [lecturerFormData, setLecturerFormData] = useState(initialLecturerFormData)
  const [fakultasFormData, setFakultasFormData] = useState(initialFakultasFormData)
  const [prodiFormData, setProdiFormData] = useState(initialProdiFormData)
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

    // Reset all form fragments and UI state when dialog is closed or after submit
    setStudentFormData(initialStudentFormData)
    setLecturerFormData(initialLecturerFormData)
    setFakultasFormData(initialFakultasFormData)
    setProdiFormData(initialProdiFormData)
    setMatkulFormData(initialMatkulFormData)
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


    if (isProdi && !selectedFakultasId) {
      setSubmitError("Fakultas induk wajib dipilih.")
      return
    }
    if (!isFakultas && !isProdi && !selectedProdiId) {
      setSubmitError("Program Studi wajib dipilih.")
      return
    }
    if (!isFakultas && !isProdi && !isLecturer && !selectedDosenId) {
      setSubmitError("Dosen Wali wajib dipilih.")
      return
    }

    // Submit flow: choose the correct thunk depending on active form
    // Each branch should `unwrap()` the promise so errors are caught here
    setIsSubmitting(true)
    try {
      if (isFakultas) {
        await dispatch(createFakultas(fakultasFormData)).unwrap()
        resetForm()
        setDialogOpen(false)
        return
      }

      if (isProdi) {
        await dispatch(createProdi({
          ...prodiFormData,
          fakultasId: Number(selectedFakultasId),
        })).unwrap()
        resetForm()
        setDialogOpen(false)
        return
      }

      if (isMatkul) {
        if (!selectedProdiId) {
          setSubmitError("Program Studi wajib dipilih untuk mata kuliah.")
          return
        }
        await dispatch(createMatkul({
          kode: matkulFormData.kode,
          name_mk: matkulFormData.name_mk,
          sks: Number(matkulFormData.sks),
          semester: Number(matkulFormData.semester),
          prodiId: Number(selectedProdiId),
        })).unwrap()
        resetForm()
        setDialogOpen(false)
        return
      }

      let avatarKey: string | undefined

      if (croppedImage) {
        const blob = dataUrlToBlob(croppedImage)
        const contentType = blob.type || "image/png"

        const uploadAction = isLecturer ? getLecturerAvatarUploadUrl : getAvatarUploadUrl
        const { uploadUrl, key } = await dispatch(uploadAction(contentType)).unwrap()

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

      if (isLecturer) {
        await dispatch(createLecturer({
          ...lecturerFormData,
          birthDate: date ? date.toISOString() : undefined,
          prodiId: selectedProdiId!,
          avatarKey,
        })).unwrap()
      } else {
        await dispatch(createStudent({
          ...studentFormData,
          birthDate: date ? date.toISOString() : undefined,
          angkatan: Number(studentFormData.angkatan),
          semester: Number(studentFormData.semester),
          prodiId: selectedProdiId!,
          dosenId: selectedDosenId!,
          avatarKey,
        })).unwrap()
      }

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
      <form id={`${entityNameLower}-form`} onSubmit={handleSubmit}>
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
              formData={fakultasFormData}
              setFormData={setFakultasFormData}
              isConfirmed={isConfirmed}
              setIsConfirmed={setIsConfirmed}
            /> 
            
            : isProdi ? <ProdiField
              formData={prodiFormData}
              setFormData={setProdiFormData}
              fakultas={fakultas}
              selectedFakultasId={selectedFakultasId}
              setSelectedFakultasId={setSelectedFakultasId}
              isConfirmed={isConfirmed}
              setIsConfirmed={setIsConfirmed}
            /> 
            
            : isMatkul ? <MatkulField
              formData={matkulFormData}
              setFormData={setMatkulFormData}
              prodi={prodi}
              selectedProdiId={selectedProdiId}
              setSelectedProdiId={setSelectedProdiId}
              isConfirmed={isConfirmed}
              setIsConfirmed={setIsConfirmed}
            /> 
            
            : isLecturer ? <DosenField
              formData={lecturerFormData}
              setFormData={setLecturerFormData}
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
            /> 
            
            : <MahasiswaField
              formData={studentFormData}
              setFormData={setStudentFormData}
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
            />}

            
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose render={<Button variant="outline" type="button">Cancel</Button>} />
            <Button type="submit" form={`${entityNameLower}-form`} disabled={!isConfirmed || isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
