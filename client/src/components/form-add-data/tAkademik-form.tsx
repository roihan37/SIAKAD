import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

import { Controller, useForm, type FieldErrors } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { useAppDispatch } from "@/hooks/redux"
import { createTAkademik, getAllTAkademik } from "@/features/action/tAkademikThunk"
import { tAkademikSchema, type TahunAkademikFormInput, type TahunAkademikFormValues } from "@/schemas"

const semesterList = [
  {
    label: "Ganjil",
    value: "GANJIL",
  },
  {
    label: "Genap",
    value: "GENAP",
  },
]

interface TahunAkademikFieldProps {
  isConfirmed: boolean
  setIsConfirmed: (checked: boolean) => void
  onSuccess: () => void
  onError: (error: string) => void
}

export function TAkademikField({
  isConfirmed,
  setIsConfirmed,
  onSuccess,
  onError,
}: TahunAkademikFieldProps) {
  const dispatch = useAppDispatch()

  const tAkademikForm = useForm<
    TahunAkademikFormInput,
    unknown,
    TahunAkademikFormValues
  >({
    resolver: zodResolver(tAkademikSchema),
    mode: "onChange",

    defaultValues: {
      tahun: "",
      semester: undefined,
      isActive: false,
    },
  })

  const {
    register,
    control,
    reset,
    formState: {
      errors,
    },
  } = tAkademikForm

  const handleSubmit = async (
    data: TahunAkademikFormValues
  ) => {
    try {
      await dispatch(
        createTAkademik(data)
      ).unwrap()

      await dispatch(
        getAllTAkademik({})
      ).unwrap()

      reset()

      setIsConfirmed(false)

      onSuccess()
    } catch (error: unknown) {
      onError(
        typeof error === "string"
          ? error
          : "Terjadi kesalahan, coba lagi."
      )
    }
  }
  const handleInvalid = (
    errors: FieldErrors<TahunAkademikFormInput>
  ) => {
    console.log("VALIDASI GAGAL:", errors)
  }

  return (
    <form
      id="tahun-akademik-form"
      onSubmit={tAkademikForm.handleSubmit(
        handleSubmit, handleInvalid
      )}
    >
      <FieldGroup>

        {/* TAHUN AKADEMIK */}
        <Field data-invalid={!!errors.tahun}>
          <FieldLabel htmlFor="tahun-akademik">
            Tahun Akademik
          </FieldLabel>

          <Input
            id="tahun-akademik"
            placeholder="2026/2027"
            aria-invalid={!!errors.tahun}
            {...register("tahun")}
          />

          <FieldDescription>
            Masukkan tahun akademik dengan format
            YYYY/YYYY.
          </FieldDescription>

          <FieldError>
            {errors.tahun?.message}
          </FieldError>
        </Field>

        {/* SEMESTER */}
        <Controller
          control={control}
          name="semester"
          render={({ field, fieldState }) => (
            <Field
              data-invalid={fieldState.invalid}
            >
              <FieldLabel htmlFor="semester">
                Semester
              </FieldLabel>

              <Select
                items={semesterList}
                value={field.value ?? ""}
                onValueChange={(value) => {
                  field.onChange(value)
                }}
                onOpenChange={(open) => {
                  if (!open) {
                    field.onBlur()
                  }
                }}
              >
                <SelectTrigger
                  id="semester"
                  aria-invalid={
                    fieldState.invalid
                  }
                  className="w-full"
                >
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    {semesterList.map(
                      (item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
                        </SelectItem>
                      )
                    )}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <FieldError>
                {fieldState.error?.message}
              </FieldError>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="isActive"
          render={({ field, fieldState }) => (
            <Field
              orientation="horizontal"
              className="items-start gap-2"
              data-invalid={fieldState.invalid}
            >
              <Checkbox
                id="tahun-akademik-active"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true)
                }}
              />

              <FieldContent>
                <FieldLabel htmlFor="tahun-akademik-active">
                  Aktifkan Tahun Akademik
                </FieldLabel>

                <FieldDescription>
                  Tahun akademik ini akan menjadi periode akademik aktif.
                </FieldDescription>

                <FieldError>
                  {fieldState.error?.message}
                </FieldError>
              </FieldContent>
            </Field>
          )}
        />

        {/* KONFIRMASI */}
        <Field
          orientation="horizontal"
          className="items-start gap-2 pt-2 pb-4"
        >
          <Checkbox
            id="tahun-akademik-confirm-checkbox"
            checked={isConfirmed}
            onCheckedChange={(checked) =>
              setIsConfirmed(
                checked === true
              )
            }
          />

          <FieldContent>
            <FieldLabel htmlFor="tahun-akademik-confirm-checkbox">
              Data yang saya masukkan sudah benar
            </FieldLabel>

            <FieldDescription>
              Periksa kembali tahun akademik dan
              semester sebelum menyimpan.
            </FieldDescription>
          </FieldContent>
        </Field>

      </FieldGroup>
    </form>
  )
}

export default TAkademikField