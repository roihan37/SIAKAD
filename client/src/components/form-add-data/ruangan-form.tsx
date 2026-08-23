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
import { useForm, type UseFormReturn } from "react-hook-form"
import { ruanganSchema, type RuanganFormInput, type RuanganFormValues } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAppDispatch } from "@/hooks/redux"
import type { RuanganFieldProps } from "@/types/props"






export function RuanganField({
  
  isConfirmed,
  setIsConfirmed,
}: RuanganFieldProps) {
  const dispatch = useAppDispatch()

const ruanganForm = useForm<
    RuanganFormInput,
    unknown,
    RuanganFormValues
  >({
    resolver: zodResolver(ruanganSchema),
    mode: "onChange",
    defaultValues: {
      kode: "",
      nama: "",
      kapasitas: 0,
      gedung: "",
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
  } = ruanganForm

  const submitRuangan = async (
      data: RuanganFormValues
    ) => {
      setSubmitError(null)
  
      try {
        setIsSubmitting(true)
  
        await dispatch(
          createRuangan(data)
        ).unwrap()
  
        ruanganForm.reset()
        setDialogOpen(false)
      } catch (err: any) {
        setSubmitError(
          typeof err === "string"
            ? err
            : err?.message ?? "Terjadi kesalahan, coba lagi."
        )
      } finally {
        setIsSubmitting(false)
      }
    }

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