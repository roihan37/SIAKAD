import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { FakultasFieldProps } from "@/types/props"

export function FakultasField({ formData, setFormData, isConfirmed, setIsConfirmed, errors }: FakultasFieldProps) {
  return (
    <FieldGroup>
      <Field data-invalid={!!errors?.kode}>
        <FieldLabel htmlFor="fakultas-kode">Kode Fakultas</FieldLabel>
        <Input
          id="fakultas-kode"
          placeholder="FTI"
          value={formData.kode}
          aria-invalid={!!errors?.kode}
          onChange={(event) => setFormData((data) => ({ ...data, kode: event.target.value }))}
        />
        <FieldDescription>Kode harus unik, misalnya FTI atau FEB.</FieldDescription>
        <FieldError>{errors?.kode}</FieldError>
      </Field>

      <Field data-invalid={!!errors?.name}>
        <FieldLabel htmlFor="fakultas-name">Nama Fakultas</FieldLabel>
        <Input
          id="fakultas-name"
          placeholder="Fakultas Teknologi Informasi"
          value={formData.name}
          aria-invalid={!!errors?.name}
          onChange={(event) => setFormData((data) => ({ ...data, name: event.target.value }))}
        />
        <FieldError>{errors?.name}</FieldError>
      </Field>

      <Field orientation="horizontal" className="items-start gap-2 pt-2 pb-4">
        <Checkbox
          id="fakultas-confirm-checkbox"
          checked={isConfirmed}
          onCheckedChange={(checked) => setIsConfirmed(checked === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor="fakultas-confirm-checkbox">Data yang saya masukkan sudah benar</FieldLabel>
          <FieldDescription>Saya sudah memeriksa kode dan nama fakultas.</FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}
