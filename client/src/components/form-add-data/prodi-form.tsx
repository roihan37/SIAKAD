import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProdiFieldProps } from "@/types/props"

export function ProdiField({
  formData,
  setFormData,
  fakultas,
  selectedFakultasId,
  setSelectedFakultasId,
  isConfirmed,
  setIsConfirmed,
  errors,
}: ProdiFieldProps) {
  return (
    <FieldGroup>
      <Field data-invalid={!!errors?.kode}>
        <FieldLabel htmlFor="prodi-kode">Kode Program Studi</FieldLabel>
        <Input
          id="prodi-kode"
          placeholder="TI"
          value={formData.kode}
          aria-invalid={!!errors?.kode}
          onChange={(event) => setFormData((data) => ({ ...data, kode: event.target.value }))}
        />
        <FieldDescription>Kode harus unik, misalnya TI, SI, atau AK.</FieldDescription>
        <FieldError>{errors?.kode}</FieldError>
      </Field>

      <Field data-invalid={!!errors?.name}>
        <FieldLabel htmlFor="prodi-name">Nama Program Studi</FieldLabel>
        <Input
          id="prodi-name"
          placeholder="Teknik Informatika"
          value={formData.name}
          aria-invalid={!!errors?.name}
          onChange={(event) => setFormData((data) => ({ ...data, name: event.target.value }))}
        />
        <FieldError>{errors?.name}</FieldError>
      </Field>

      <Field data-invalid={!!errors?.fakultasId}>
        <FieldLabel htmlFor="prodi-fakultas">Fakultas Induk</FieldLabel>
        <Select
          value={selectedFakultasId === null ? undefined : String(selectedFakultasId)}
          onValueChange={(value) => setSelectedFakultasId(Number(value))}
        >
          <SelectTrigger id="prodi-fakultas" aria-invalid={!!errors?.fakultasId}>
            <SelectValue placeholder="Pilih fakultas induk" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {fakultas.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldError>{errors?.fakultasId}</FieldError>
      </Field>

      <Field orientation="horizontal" className="items-start gap-2 pt-2 pb-4">
        <Checkbox
          id="prodi-confirm-checkbox"
          checked={isConfirmed}
          onCheckedChange={(checked) => setIsConfirmed(checked === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor="prodi-confirm-checkbox">Data yang saya masukkan sudah benar</FieldLabel>
          <FieldDescription>Saya sudah memeriksa kode, nama, dan fakultas induk program studi.</FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}
