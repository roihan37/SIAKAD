import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Controller, useForm } from "react-hook-form"
import { matkulSchema, type MatkulFormInput, type MatkulFormValues } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { createMatkul, getAllMatkul } from "@/features/action/matkulThunk"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { KurikulumFieldProps } from "@/types/props"
import { useEffect } from "react"
import { createKurikulum, getAllKurikulum } from "@/features/action/kurikulumThunk"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "../ui/combobox"
import { kurikulumSchema, type KurikulumFormInput, type KurikulumFormValues } from "@/schemas/kurikulum.schema"
import { getAllProdi } from "@/features/action/campusThunk"

export function KurikulumField({
  isConfirmed,
  setIsConfirmed,
  onSuccess, onError }
  : KurikulumFieldProps) {

  const dispatch = useAppDispatch()
  const {prodi} = useAppSelector((state)=>state.campus)
  useEffect(() => {
      dispatch(getAllProdi({limit: 10000, page: 1}))
    }, [dispatch])

  const kurikulumForm = useForm<
    KurikulumFormInput,
    unknown,
    KurikulumFormValues
  >({
    resolver: zodResolver(kurikulumSchema),
    mode: "onChange",
    defaultValues: {
      kode: '',
      nama: '',
      tahun : 0,
      prodiId: 0,
      isActive : false
    },
  })

  const {
    register,
    control,
    reset,
    formState: {
      errors,
    },
  } = kurikulumForm

  const handleSubmit = async (
    data: KurikulumFormValues
  ) => {
    try {

      await dispatch(
        createKurikulum(data)
      ).unwrap()

      await dispatch(
        getAllKurikulum()
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

  const prodiOptions = prodi.map((item) => ({
    value: item.id,
    kode: item.kode,
    label: item.name,
    fakultas: item.fakultas,
  }))

  return (
    <form
      id="kurikulum-form"
      onSubmit={
        kurikulumForm.handleSubmit(
          handleSubmit
        )
      }
    >
      <FieldGroup>
        <Field data-invalid={!!errors?.kode}>
          <FieldLabel htmlFor="kurikulum-kode">Kode Kurikulum</FieldLabel>
          <Input
            id="kurikulum-kode"
            placeholder="TI101"
            aria-invalid={!!errors?.kode}
            {...register("kode")}
          />
          <FieldDescription>Kode unik untuk kurikulum.</FieldDescription>
          <FieldError>{errors.kode?.message}</FieldError>
        </Field>

        <Field data-invalid={!!errors?.nama}>
          <FieldLabel htmlFor="kurikulum-name">Nama Kurikulum</FieldLabel>
          <Input
            id="kurikulum-name"
            placeholder="Pemrograman Web"
            aria-invalid={!!errors?.nama}
            {...register("nama")}
          />
          <FieldError>{errors.nama?.message}</FieldError>
        </Field>

        <Controller
          control={control}
          name="prodiId"
          render={({ field, fieldState }) => {
            const selectedProdi =
              prodiOptions.find(
                (item) => Number(item.value) === field.value
              ) ?? null

            return (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-kurikulum">
                  Prodi
                </FieldLabel>

                <Combobox
                  items={prodiOptions}
                  value={selectedProdi}
                  onValueChange={(value) => {
                    field.onChange(
                      value?.value ?? 0
                    )
                  }}
                >
                  <ComboboxInput
                    id="form-prodi"
                    placeholder="Cari Prodi..."
                    aria-invalid={fieldState.invalid}
                    className="w-full"
                    onBlur={field.onBlur}
                  />

                  <ComboboxContent >
                    <ComboboxEmpty>
                      Prodi tidak ditemukan.
                    </ComboboxEmpty>

                    <ComboboxList >
                      {(item) => (
                        <ComboboxItem
                          key={item.value}
                          value={item}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {item.label}
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {item.fakultas}
                            </span>
                          </div>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                <FieldError>
                  {fieldState.error?.message}
                </FieldError>
              </Field>
            )
          }}
        />


        <Field data-invalid={!!errors?.tahun}>
          <FieldLabel htmlFor="kurikulum-tahun">Tahun</FieldLabel>
          <Input
            id="kurikulum-tahun"
            placeholder="2026"
            type="number"
            aria-invalid={!!errors?.tahun}
            {...register("tahun", {
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
          <FieldError>{errors.tahun?.message}</FieldError>
        </Field>

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
                id="kurikulum-active"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked === true)
                }}
              />

              <FieldContent>
                <FieldLabel htmlFor="kurikulum-active">
                  Aktifkan Kurikulum
                </FieldLabel>

                <FieldError>
                  {fieldState.error?.message}
                </FieldError>
              </FieldContent>
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

export default KurikulumField
