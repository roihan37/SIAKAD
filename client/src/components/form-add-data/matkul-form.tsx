import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Controller, useForm } from "react-hook-form"
import { matkulSchema, type MatkulFormInput, type MatkulFormValues } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { createMatkul, getAllMatkul } from "@/features/action/matkulThunk"
import { useAppDispatch } from "@/hooks/redux"
import type { MatkulFieldProps } from "@/types/props"

export function MatkulField({
  prodi, isConfirmed,
  setIsConfirmed,
  onSuccess, onError }
  : MatkulFieldProps) {

  const dispatch = useAppDispatch()

  const matkulForm = useForm<
    MatkulFormInput,
    unknown,
    MatkulFormValues
  >({
    resolver: zodResolver(matkulSchema),
    mode: "onChange",
    defaultValues: {
      kode: '',
      nama: '',
      sks: 2,
      semester: 1,
      prodiId: 0,
    },
  })

  const {
    register,
    control,
    reset,
    formState: {
      errors,
    },
  } = matkulForm

  const handleSubmit = async (
    data: MatkulFormValues
  ) => {
    try {

      await dispatch(
        createMatkul(data)
      ).unwrap()

      await dispatch(
        getAllMatkul()
      ).unwrap()

      reset()
      setIsConfirmed(false)
      onSuccess()

    } catch (error: any) {

      onError(
        error ??
        "Terjadi kesalahan, coba lagi."
      )

    }
  }

  return (
    <form
      id="mata-kuliah-form"
      onSubmit={
        matkulForm.handleSubmit(
          handleSubmit
        )
      }
    >
      <FieldGroup>
        <Field data-invalid={!!errors?.kode}>
          <FieldLabel htmlFor="matkul-kode">Kode Mata Kuliah</FieldLabel>
          <Input
            id="matkul-kode"
            placeholder="TI101"
            aria-invalid={!!errors?.kode}
            {...register("kode")}
          />
          <FieldDescription>Kode unik untuk mata kuliah.</FieldDescription>
          <FieldError>{errors.kode?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.nama}>
          <FieldLabel htmlFor="matkul-name">Nama Mata Kuliah</FieldLabel>
          <Input
            id="matkul-name"
            placeholder="Pemrograman Web"
            aria-invalid={!!errors?.nama}
            {...register("nama")}
          />
          <FieldError>{errors.nama?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.sks}>
          <FieldLabel htmlFor="matkul-sks">SKS</FieldLabel>
          <Input
            id="matkul-sks"
            placeholder="3"
            type="number"
            aria-invalid={!!errors?.sks}
            {...register("sks", {
                valueAsNumber: true,
                onChange: (e) => {
                  const value = e.target.value

                  // Hilangkan leading zero
                  if (value.length > 1 && value.startsWith("0")) {
                    e.target.value = value.replace(/^0+/, "")
                  }
                },
              })}
          />
          <FieldError>{errors.semester?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.sks}>
          <FieldLabel htmlFor="matkul-semester">Semester</FieldLabel>
          <Input
            id="matkul-semester"
            placeholder="3"
            type="number"
            aria-invalid={!!errors?.semester}
            {...register("semester", {
                valueAsNumber: true,
                onChange: (e) => {
                  const value = e.target.value

                  // Hilangkan leading zero
                  if (value.length > 1 && value.startsWith("0")) {
                    e.target.value = value.replace(/^0+/, "")
                  }
                },
              })}
          />
          <FieldError>{errors.semester?.message}</FieldError>
        </Field>

        <Controller
  control={control}
  name="prodiId"
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="form-prodi">
        Program Studi
      </FieldLabel>

      <Select
        items={prodi.map((item) => ({
          label: item.name,
          value: String(item.id),
        }))}
        value={
          field.value > 0
            ? String(field.value)
            : ""
        }
        onValueChange={(value) => {
          field.onChange(
            value ? Number(value) : 0
          )
        }}
        onOpenChange={(open) => {
          if (!open) {
            field.onBlur()
          }
        }}
      >
        <SelectTrigger
          id="form-prodi"
          aria-invalid={fieldState.invalid}
          className="w-full"
        >
          <SelectValue placeholder="Pilih program studi" />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {prodi.map((item) => (
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
    </form>
  )
}

export default MatkulField
