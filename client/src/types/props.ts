import type { DosenFormInput, DosenFormValues, FakultasFormInput, FakultasFormValues, MahasiswaFormInput, MahasiswaFormValues, ProdiFormValues, ProdiFromInput } from "@/schemas";
import type { Dosen } from "./campus";
import type { UseFormReturn } from "react-hook-form";

export type FormErrors = Record<string, string>

export interface MahasiswaFieldProps {
  // form data sederhana (text/number input)
  form: UseFormReturn<
    MahasiswaFormInput,
    unknown,
    MahasiswaFormValues
  >
  onSubmit: (data: MahasiswaFormValues) => Promise<void>
  // setFormData: React.Dispatch<React.SetStateAction<MahasiswaFieldProps["formData"]>>

  // dropdown data dari Redux
  fakultas: { id: string; name: string }[]
  prodi: { id: string; name: string }[]
  lecturers: Dosen[]

  // dependent-select state
  selectedFakultasId: number | null
  setSelectedFakultasId: (id: number | null) => void
  selectedProdiId: number | null
  setSelectedProdiId: (id: number | null) => void
  selectedDosenId: string | null
  setSelectedDosenId: (id: string | null) => void

  // date picker
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  open: boolean
  setOpen: (open: boolean) => void

  // foto profil
  selectedFile: File | null
  croppedImage: string | null
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onResetPhoto: () => void
  onCropped: (dataUrl: string) => void

  // checkbox konfirmasi
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void

  // error submit (opsional ditampilkan di sini)
  submitError: string | null
  errors?: FormErrors
}

export interface DosenFieldProps {
  form: UseFormReturn<
    DosenFormInput,
    unknown,
    DosenFormValues
  >
  onSubmit: (data: DosenFormValues) => Promise<void>

  fakultas: { id: string; name: string }[]
  prodi: { id: string; name: string }[]
  selectedFakultasId: number | null
  setSelectedFakultasId: (id: number | null) => void
  selectedProdiId: number | null
  setSelectedProdiId: (id: number | null) => void

  date: Date | undefined
  setDate: (date: Date | undefined) => void
  open: boolean
  setOpen: (open: boolean) => void

  selectedFile: File | null
  croppedImage: string | null
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onResetPhoto: () => void
  onCropped: (dataUrl: string) => void

  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
  submitError: string | null
  errors?: FormErrors
}

export interface FakultasFieldProps {
  form: UseFormReturn<
    FakultasFormInput,
    unknown,
    FakultasFormValues
  >
  onSubmit: (data: FakultasFormValues) => Promise<void>
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
  errors?: FormErrors
}

export interface ProdiFieldProps {
  form: UseFormReturn<
    ProdiFromInput,
    unknown,
    ProdiFormValues
  >
  onSubmit: (data: ProdiFormValues) => Promise<void>
  fakultas: { id: number | string; name: string }[]
  selectedFakultasId: number | null
  setSelectedFakultasId: (id: number | null) => void
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
  errors?: FormErrors
}
