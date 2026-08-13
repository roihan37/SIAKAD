import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { FakultasFieldProps } from "@/types/props"

export function FakultasField({ formData, setFormData, isConfirmed, setIsConfirmed }: FakultasFieldProps) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="fakultas-kode">Kode Fakultas</FieldLabel>
        <Input
          id="fakultas-kode"
          placeholder="FTI"
          required
          value={formData.kode}
          onChange={(event) => setFormData((data) => ({ ...data, kode: event.target.value }))}
        />
        <FieldDescription>Kode harus unik, misalnya FTI atau FEB.</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="fakultas-name">Nama Fakultas</FieldLabel>
        <Input
          id="fakultas-name"
          placeholder="Fakultas Teknologi Informasi"
          required
          value={formData.name}
          onChange={(event) => setFormData((data) => ({ ...data, name: event.target.value }))}
        />
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
