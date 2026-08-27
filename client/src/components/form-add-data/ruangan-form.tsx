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
import { useForm } from "react-hook-form"
import { ruanganSchema, type RuanganFormInput, type RuanganFormValues } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAppDispatch } from "@/hooks/redux"
import type { RuanganFieldProps } from "@/types/props"
import { createRuangan, getAllRuangan } from "@/features/action/ruanganThunk"

export function RuanganField({
  onSuccess,
  onError,
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
    reset,
    formState: {
      errors,
    },
  } = ruanganForm


  const submitRuangan = async (
      data: RuanganFormValues
    ) => {
  
      try {

  
        await dispatch(
          createRuangan(data)
        ).unwrap()
        
        await dispatch(
          getAllRuangan()
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
  id="ruangan-form"
  onSubmit={ruanganForm.handleSubmit(submitRuangan)}
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
                onChange: (e) => {
                  const value = e.target.value

                  // Hilangkan leading zero
                  if (value.length > 1 && value.startsWith("0")) {
                    e.target.value = value.replace(/^0+/, "")
                  }
                },
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