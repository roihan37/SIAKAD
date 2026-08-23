import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createProdi } from "@/features/action/campusThunk"
import { useAppDispatch } from "@/hooks/redux"
import { prodiSchema, type ProdiFormValues, type ProdiFromInput } from "@/schemas"
import type { ProdiFieldProps } from "@/types/props"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

export function ProdiField({
  fakultas,
  // selectedFakultasId,
  // setSelectedFakultasId,
  isConfirmed,
  setIsConfirmed,
  onSuccess,
  onError
}: ProdiFieldProps) {

  const dispatch = useAppDispatch()

  const [isSubmitting, setIsSubmitting] =
      useState(false)

  const prodiForm = useForm<
      ProdiFromInput,
      unknown,
      ProdiFormValues
    >({
      resolver: zodResolver(prodiSchema),
      mode: "onChange",
      defaultValues: {
        kode: "",
        name: "",
      },
    })
    
  const {
    register,
    control,
    watch,
    setValue,
    reset,
    formState: {
      errors,
    },
  } = prodiForm

  // const fakultasId = watch("fakultasId")

  // useEffect(() => {
  
  //     if (!fakultasId) {
  //       setValue("prodiId", 0)
  //       setValue("dosenId", "")
  //       return
  //     }
  
  //     dispatch(
  //       getAllProdi({
  //         fakultasId,
  //       })
  //     )
  
  //   }, [
  //     fakultasId,
  //     dispatch,
  //     setValue,
  //   ])

  const submitProdi = async (
      data: ProdiFormValues
    ) => {
  
      try {
        setIsSubmitting(true)
  
        await dispatch(
          createProdi(data)
        ).unwrap()
  
        reset()
        setIsConfirmed(false)
        onSuccess()
      } catch (error: any) {
        onError(
          error?.message ??
          "Terjadi kesalahan, coba lagi."
        )
      } finally {
        setIsSubmitting(false)
      }
    }

  return (
    <form
      id="prodi-form"
      onSubmit={prodiForm.handleSubmit(submitProdi)}
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
