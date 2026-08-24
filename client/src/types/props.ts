import type { DosenFormInput, DosenFormValues, FakultasFormInput, FakultasFormValues, MahasiswaFormInput, MahasiswaFormValues, ProdiFormValues, ProdiFromInput } from "@/schemas";
import type { Dosen, Fakultas, ProgramStudi } from "./campus";
import type { UseFormReturn } from "react-hook-form";

export type FormErrors = Record<string, string>

export interface MahasiswaFieldProps {
  fakultas: Fakultas[]
  prodi: ProgramStudi[]
  lecturers: Dosen[]

  isConfirmed: boolean
  setIsConfirmed: (value: boolean) => void

  onSuccess: () => void
  onError: (message: string) => void
}

export interface DosenFieldProps {
  fakultas: Fakultas[]
  prodi: ProgramStudi[]

  isConfirmed: boolean
  setIsConfirmed: (value: boolean) => void

  onSuccess: () => void
  onError: (message: string) => void
}

export interface FakultasFieldProps {
  onSuccess: () => void
  onError: (message: string) => void
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
  errors?: FormErrors
}

export interface ProdiFieldProps {
  onSuccess: () => void
  onError: (message: string) => void
  fakultas: { id: number | string; name: string }[]
  // selectedFakultasId: number | null
  // setSelectedFakultasId: (id: number | null) => void
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
  errors?: FormErrors
}

export interface RuanganFieldProps {
  onSuccess: () => void
  onError: (message: string) => void
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
}

export interface MatkulFieldProps {
  prodi: { id: number | string; name: string }[]
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
  onSuccess: () => void
  onError: (message: string) => void
}

