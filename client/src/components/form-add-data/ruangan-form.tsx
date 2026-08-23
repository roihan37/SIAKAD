import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import type { UseFormReturn } from "react-hook-form"
import type { RuanganFormInput, RuanganFormValues } from "@/schemas"


interface RuanganFieldProps {
  form: UseFormReturn<
    RuanganFormInput,
    unknown,
    RuanganFormValues
  >
  onSubmit: (data: RuanganFormValues) => Promise<void>
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
}

export function RuanganField({
  form,
  onSubmit,
  isConfirmed,
  setIsConfirmed,
}: RuanganFieldProps) {
  const { register, formState: { errors } } = form

  return (
  <form
  id="ruangan-form"
  onSubmit={form.handleSubmit(onSubmit)}
>
    <FieldGroup>
      <Field data-invalid={!!errors.kode}>
        <FieldLabel htmlFor="ruangan-kode">
          Kode Ruangan
        </FieldLabel>

        <Input
          id="ruangan-kode"
          placeholder="R101"
          aria-invalid={!!errors.kode}
          {...register("kode")}
        />

        <FieldDescription>
          Kode unik untuk ruangan.
        </FieldDescription>

        <FieldError>
          {errors.kode?.message}
        </FieldError>
      </Field>

      <Field data-invalid={!!errors.nama}>
        <FieldLabel htmlFor="ruangan-nama">
          Nama Ruangan
        </FieldLabel>

        <Input
          id="ruangan-nama"
          placeholder="Ruang 101"
          aria-invalid={!!errors.nama}
          {...register("nama")}
        />

        <FieldError>
          {errors.nama?.message}
        </FieldError>
      </Field>

      <Field data-invalid={!!errors.kapasitas}>
        <FieldLabel htmlFor="ruangan-kapasitas">
          Kapasitas
        </FieldLabel>

        <Input
          id="ruangan-kapasitas"
          placeholder="20"
          type="number"
          min="20"
          aria-invalid={!!errors.kapasitas}
          {...register("kapasitas", {
            valueAsNumber: true,
          })}
        />

        <FieldError>
          {errors.kapasitas?.message}
        </FieldError>
      </Field>

      <Field data-invalid={!!errors.gedung}>
        <FieldLabel htmlFor="gedung">
          Gedung
        </FieldLabel>

        <Input
          id="gedung"
          placeholder="Gedung Solehun"
          aria-invalid={!!errors.gedung}
          {...register("gedung")}
        />

        <FieldError>
          {errors.gedung?.message}
        </FieldError>
      </Field>

      <Field
        orientation="horizontal"
        className="items-start gap-2 pt-2 pb-4"
      >
        <Checkbox
          id="ruangan-confirm-checkbox"
          checked={isConfirmed}
          onCheckedChange={(checked) =>
            setIsConfirmed(checked === true)
          }
        />

        <FieldContent>
          <FieldLabel htmlFor="ruangan-confirm-checkbox">
            Data yang saya masukkan sudah benar
          </FieldLabel>

          <FieldDescription>
            Periksa kembali kode, nama, kapasitas, dan gedung.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
    </form>
  )
}

export default RuanganField