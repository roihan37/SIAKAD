import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProdiFieldProps } from "@/types/props"
import { Controller } from "react-hook-form"

export function ProdiField({
  form,
  onSubmit,
  fakultas,
  selectedFakultasId,
  setSelectedFakultasId,
  isConfirmed,
  setIsConfirmed,
}: ProdiFieldProps) {
  const {
    register, control,
    formState: {errors}
  } = form
  return (
    <form
      id="prodi-form"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>
        <Field data-invalid={!!errors?.kode}>
          <FieldLabel htmlFor="prodi-kode">Kode Program Studi</FieldLabel>
          <Input
            id="prodi-kode"
            placeholder="TI"
            aria-invalid={!!errors?.kode}
            {...register("kode")}
          />
          <FieldDescription>Kode harus unik, misalnya TI, SI, atau AK.</FieldDescription>
          <FieldError>{errors.kode?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.name}>
          <FieldLabel htmlFor="prodi-name">Nama Program Studi</FieldLabel>
          <Input
            id="prodi-name"
            placeholder="Teknik Informatika"
            aria-invalid={!!errors?.name}
            {...register("name")}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>

         <Controller
            control={control}
            name="fakultasId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lecturer-fakultas">
                  Fakultas
                </FieldLabel>

                <Select
                  items={fakultas.map((item) => ({
                    label: item.name,
                    value: String(item.id),
                  }))}
                  value={
                    field.value
                      ? String(field.value)
                      : ""
                  }
                  onValueChange={(value) => {
                    field.onChange(Number(value))
                  }}
                >
                  <SelectTrigger
                    id="lecturer-fakultas"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Pilih fakultas" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {fakultas.map((item) => (
                        <SelectItem
                          key={item.id}
                          value={String(item.id)}
                        >
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>

                <FieldError>
                  {fieldState.error?.message}
                </FieldError>
              </Field>
            )}
          />

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
    </form>
  )
}
