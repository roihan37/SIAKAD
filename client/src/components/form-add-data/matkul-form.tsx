import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { Dispatch, SetStateAction } from "react"

type MatkulFormData = {
  kode: string
  name_mk: string
  sks: string
  semester: string
}

interface MatkulFieldProps {
  formData: MatkulFormData
  setFormData: Dispatch<SetStateAction<MatkulFormData>>
  prodi: { id: number | string; name: string }[]
  selectedProdiId: number | null
  setSelectedProdiId: (id: number | null) => void
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
}

export function MatkulField({ formData, setFormData, prodi, selectedProdiId, setSelectedProdiId, isConfirmed, setIsConfirmed }: MatkulFieldProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="matkul-kode">Kode Mata Kuliah</FieldLabel>
        <Input
          id="matkul-kode"
          placeholder="TI101"
          required
          value={formData.kode}
          onChange={(e) => setFormData((d) => ({ ...d, kode: e.target.value }))}
        />
        <FieldDescription>Kode unik untuk mata kuliah.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="matkul-name">Nama Mata Kuliah</FieldLabel>
        <Input
          id="matkul-name"
          placeholder="Pemrograman Web"
          required
          value={formData.name_mk}
          onChange={(e) => setFormData((d) => ({ ...d, name_mk: e.target.value }))}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="matkul-sks">SKS</FieldLabel>
        <Input
          id="matkul-sks"
          placeholder="3"
          required
          type="number"
          value={formData.sks}
          onChange={(e) => setFormData((d) => ({ ...d, sks: e.target.value }))}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="matkul-semester">Semester</FieldLabel>
        <Select
          value={formData.semester === "" ? undefined : String(formData.semester)}
          onValueChange={(value) => setFormData((d) => ({ ...d, semester: String(value) }))}
        >
          <SelectTrigger id="matkul-semester">
            <SelectValue placeholder="Pilih semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {Array.from({ length: 8 }).map((_, idx) => (
                <SelectItem key={idx + 1} value={String(idx + 1)}>
                  {idx + 1}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel htmlFor="matkul-prodi">Program Studi</FieldLabel>
        <Select
          value={selectedProdiId === null ? undefined : String(selectedProdiId)}
          onValueChange={(value) => setSelectedProdiId(Number(value))}
        >
          <SelectTrigger id="matkul-prodi">
            <SelectValue placeholder="Pilih program studi" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {prodi.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field orientation="horizontal" className="items-start gap-2 pt-2 pb-4">
        <Checkbox
          id="matkul-confirm-checkbox"
          checked={isConfirmed}
          onCheckedChange={(checked) => setIsConfirmed(checked === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor="matkul-confirm-checkbox">Data yang saya masukkan sudah benar</FieldLabel>
          <FieldDescription>Periksa kembali kode, nama, SKS, semester, dan prodi.</FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}

export default MatkulField
