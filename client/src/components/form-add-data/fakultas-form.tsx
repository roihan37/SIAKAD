import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createFakultas, getAllFakultas } from "@/features/action/campusThunk"
import { useAppDispatch } from "@/hooks/redux"
import { fakultasSchema, type FakultasFormInput, type FakultasFormValues } from "@/schemas"
import type { FakultasFieldProps } from "@/types/props"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"

export function FakultasField({ isConfirmed, setIsConfirmed, onSuccess, onError }: FakultasFieldProps) {
  const dispatch = useAppDispatch()

  const fakultasForm = useForm<
    FakultasFormInput,
    unknown,
    FakultasFormValues
  >({
    resolver: zodResolver(fakultasSchema),
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
  } = fakultasForm

  const submitFakultas = async (
    data: FakultasFormValues
  ) => {

    try {

      await dispatch(
        createFakultas(data)
      ).unwrap()

      await dispatch(
        getAllFakultas()
      )
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
      id="fakultas-form"
      onSubmit={fakultasForm.handleSubmit(submitFakultas)}
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
