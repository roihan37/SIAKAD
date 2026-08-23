import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { FakultasFieldProps } from "@/types/props"

export function FakultasField({ form, onSubmit, isConfirmed, setIsConfirmed }: FakultasFieldProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form

  return (
    <form
      id="fakultas-form"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <Field data-invalid={!!errors?.kode}>
          <FieldLabel htmlFor="fakultas-kode">Kode Fakultas</FieldLabel>
          <Input
            id="fakultas-kode"
            placeholder="FTI"
            aria-invalid={!!errors?.kode}
            {...register("kode")}
          />
          <FieldDescription>Kode harus unik, misalnya FTI atau FEB.</FieldDescription>
          <FieldError>{errors.kode?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.name}>
          <FieldLabel htmlFor="fakultas-name">Nama Fakultas</FieldLabel>
          <Input
            id="fakultas-name"
            placeholder="Fakultas Teknologi Informasi"
            aria-invalid={!!errors?.name}
            {...register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
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
    </form>
  )
}
