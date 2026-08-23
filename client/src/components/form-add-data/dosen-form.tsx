import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageCrop, ImageCropApply, ImageCropContent, ImageCropReset } from "@/components/kibo-ui/image-crop"
import type { DosenFieldProps } from "@/types/props"
import { XIcon } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { dosenSchema, type DosenFormInput, type DosenFormValues } from "@/schemas"
import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState, type ChangeEvent } from "react"
import { useAppDispatch } from "@/hooks/redux"
import { getAllProdi } from "@/features/action/campusThunk"
import { createLecturer, getLecturerAvatarUploadUrl } from "@/features/action/usersThunk"

const genderList = [{ label: "Laki-laki", value: "Male" }, { label: "Perempuan", value: "Female" }]
const statusList = [
  { label: "Aktif", value: "Aktif" }, { label: "Cuti", value: "Cuti" },
  { label: "Lulus", value: "Lulus" }, { label: "Nonaktif", value: "Nonaktif" },
]
const jabatanList = [
  { label: "Dosen", value: "Dosen" }, { label: "Kaprodi", value: "Kaprodi" },
  { label: "Dekan", value: "Dekan" }, { label: "Rektor", value: "Rektor" },
]

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",")

  const mimeMatch = header.match(
    /data:(.*?);base64/
  )

  const mime = mimeMatch?.[1] ?? "image/png"

  const binary = atob(base64)

  const array = new Uint8Array(
    binary.length
  )

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }

  return new Blob([array], {
    type: mime,
  })
}

export function DosenField({
  fakultas,
  prodi,

  isConfirmed,
  setIsConfirmed,

  onSuccess,
  onError,
}: DosenFieldProps) {

  const dispatch = useAppDispatch()


  const dosenForm = useForm<
    DosenFormInput,
    unknown,
    DosenFormValues
  >({
    resolver: zodResolver(dosenSchema),

    mode: "onChange",

    defaultValues: {
      nidn: "",
      name: "",
      email: "",
      username: "",
      password: "",
      gender: undefined,
      phoneNumber: "",
      address: "",
      birthDate: undefined,
      status: "Aktif",
      jabatan: "Dosen",
      fakultasId: 0,
      prodiId: 0,
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
  } = dosenForm

  const fakultasId = watch("fakultasId")
  const prodiId = watch("prodiId")

  const [datePickerOpen, setDatePickerOpen] =
    useState(false)

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  const [croppedImage, setCroppedImage] =
    useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  useEffect(() => {

    if (!fakultasId) {
      setValue("prodiId", 0)
      return
    }

    dispatch(
      getAllProdi({
        fakultasId,
      })
    )

  }, [
    fakultasId,
    dispatch,
    setValue,
  ])

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {

    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setSelectedFile(file)
    setCroppedImage(null)
  }


  const handleResetPhoto = () => {

    setSelectedFile(null)
    setCroppedImage(null)

  }

  const submitDosen = async (
    data: DosenFormValues
  ) => {
    try {
      setIsSubmitting(true)

      let avatarKey: string | undefined

      if (croppedImage) {
        const blob = dataUrlToBlob(croppedImage)
        const contentType = blob.type || "image/png"

        const {
          uploadUrl,
          key,
        } = await dispatch(
          getLecturerAvatarUploadUrl(contentType)
        ).unwrap()

        const response = await fetch(
          uploadUrl,
          {
            method: "PUT",
            headers: {
              "Content-Type": contentType,
            },
            body: blob,
          }
        )

        if (!response.ok) {
          throw new Error(
            "Upload foto ke storage gagal. Coba upload ulang."
          )
        }

        avatarKey = key
      }

      await dispatch(
        createLecturer({
          ...data,
          birthDate: data.birthDate?.toISOString(),
          avatarKey,
        })
      ).unwrap()

      reset()

      setSelectedFile(null)
      setCroppedImage(null)
      setDatePickerOpen(false)
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
      id="dosen-form"
      onSubmit={dosenForm.handleSubmit(submitDosen)}
    >
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="lecturer-fullname">
            Nama Lengkap
          </FieldLabel>

          <Input
            id="lecturer-fullname"
            type="text"
            placeholder="Dr. Budi Santoso"
            aria-invalid={!!errors.name}
            {...register("name")}
          />

          <FieldError>
            {errors.name?.message}
          </FieldError>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor="lecturer-username">
              Username
            </FieldLabel>

            <Input
              id="lecturer-username"
              type="text"
              placeholder="budi.santoso"
              aria-invalid={!!errors.username}
              {...register("username")}
            />

            <FieldError>
              {errors.username?.message}
            </FieldError>
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="lecturer-email">
              Email
            </FieldLabel>

            <Input
              id="lecturer-email"
              type="email"
              placeholder="budi@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />

            <FieldError>
              {errors.email?.message}
            </FieldError>
          </Field>
        </div>

        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="lecturer-password">
            Password
          </FieldLabel>

          <Input
            id="lecturer-password"
            type="password"
            placeholder="Minimal 8 karakter"
            aria-invalid={!!errors.password}
            {...register("password")}
          />

          <FieldError>
            {errors.password?.message}
          </FieldError>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="gender"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lecturer-gender">
                  Jenis Kelamin
                </FieldLabel>

                <Select
                  items={genderList}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="lecturer-gender"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {genderList.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
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

          <Field data-invalid={!!errors.phoneNumber}>
            <FieldLabel htmlFor="lecturer-phone">
              Nomor Telepon
            </FieldLabel>

            <Input
              id="lecturer-phone"
              type="tel"
              placeholder="+62 812-3456-7890"
              aria-invalid={!!errors.phoneNumber}
              {...register("phoneNumber")}
            />

            <FieldError>
              {errors.phoneNumber?.message}
            </FieldError>
          </Field>
        </div>

        <Controller
          control={control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="lecturer-date">
                Tanggal Lahir
              </FieldLabel>

              <Popover
                open={datePickerOpen}
                onOpenChange={
                  setDatePickerOpen
                }
              >
                <PopoverTrigger
                  render={
                    <Button
                      id="lecturer-date"
                      variant="outline"
                      type="button"
                      className="w-full justify-start font-normal"
                      aria-invalid={fieldState.invalid}
                    >
                      {field.value
                        ? field.value.toLocaleDateString("id-ID")
                        : "Pilih tanggal"}
                    </Button>
                  }
                />

                <PopoverContent
                  className="w-auto overflow-hidden p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={field.value}
                    defaultMonth={
                      field.value
                    }
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      field.onChange(date)
                      setDatePickerOpen(
                        false
                      )
                    }}
                  />
                </PopoverContent>
              </Popover>

              <FieldError>
                {fieldState.error?.message}
              </FieldError>
            </Field>
          )}
        />

        <Field data-invalid={!!errors.address}>
          <FieldLabel htmlFor="lecturer-address">
            Alamat
          </FieldLabel>

          <Input
            id="lecturer-address"
            placeholder="123 Main St"
            aria-invalid={!!errors.address}
            {...register("address")}
          />

          <FieldError>
            {errors.address?.message}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="lecturer-photo">
            Foto Profil
          </FieldLabel>

          {!selectedFile && (
            <>
              <Input
                id="lecturer-photo"
                accept="image/*"
                type="file"
                onChange={handleFileChange}
              />

              <FieldDescription>
                Format JPG/PNG/WEBP, maks 1MB.
              </FieldDescription>
            </>
          )}

          {selectedFile && !croppedImage && (
            <ImageCrop
              aspect={1}
              file={selectedFile}
              maxImageSize={1024 * 1024}
              onChange={() => { }}
              onComplete={() => { }}
              onCrop={setCroppedImage}
            >
              <ImageCropContent className="max-h-[50vh] w-auto object-contain" />

              <div className="mt-2 flex items-center gap-2">
                <ImageCropApply />
                <ImageCropReset />

                <Button
                  onClick={handleResetPhoto}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            </ImageCrop>
          )}

          {selectedFile && croppedImage && (
            <div className="flex items-center gap-3">
              <img
                alt="Cropped avatar preview"
                src={croppedImage}
                className="size-24 rounded-full object-cover"
              />

              <Button
                onClick={handleResetPhoto}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.nidn}>
            <FieldLabel htmlFor="lecturer-nidn">
              NIDN
            </FieldLabel>

            <Input
              id="lecturer-nidn"
              placeholder="0123456789"
              aria-invalid={!!errors.nidn}
              {...register("nidn")}
            />

            <FieldError>
              {errors.nidn?.message}
            </FieldError>
          </Field>
          <Controller
            control={control}
            name="fakultasId"

            render={({
              field,
              fieldState,
            }) => (

              <Field
                data-invalid={
                  fieldState.invalid
                }
              >

                <FieldLabel htmlFor="form-fakultas">
                  Fakultas
                </FieldLabel>

                <Select
                  items={fakultas.map(
                    (item) => ({
                      label: item.name,
                      value: String(
                        item.id
                      ),
                    })
                  )}

                  value={
                    field.value
                      ? String(
                        field.value
                      )
                      : ""
                  }

                  onValueChange={(
                    value
                  ) => {

                    const id =
                      Number(value)

                    field.onChange(id)

                    // reset dependent field
                    setValue(
                      "prodiId",
                      0
                    )

                  }}
                >

                  <SelectTrigger
                    id="form-fakultas"
                    aria-invalid={
                      fieldState.invalid
                    }
                  >

                    <SelectValue
                      placeholder="Pilih fakultas"
                    />

                  </SelectTrigger>


                  <SelectContent>

                    <SelectGroup>

                      {fakultas.map(
                        (item) => (

                          <SelectItem
                            key={item.id}
                            value={String(
                              item.id
                            )}
                          >
                            {item.name}
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

        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="prodiId"

            render={({
              field,
              fieldState,
            }) => (

              <Field
                data-invalid={
                  fieldState.invalid
                }
              >

                <FieldLabel htmlFor="form-prodi">
                  Program Studi
                </FieldLabel>

                <Select

                  items={prodi.map(
                    (item) => ({
                      label: item.name,
                      value: String(
                        item.id
                      ),
                    })
                  )}

                  value={
                    field.value
                      ? String(
                        field.value
                      )
                      : ""
                  }

                  onValueChange={(
                    value
                  ) => {

                    const id =
                      Number(value)

                    field.onChange(id)


                  }}

                  disabled={!fakultasId}
                >

                  <SelectTrigger
                    id="form-prodi"
                    aria-invalid={
                      fieldState.invalid
                    }
                  >

                    <SelectValue
                      placeholder={
                        fakultasId
                          ? "Pilih prodi"
                          : "Pilih fakultas dulu"
                      }
                    />

                  </SelectTrigger>


                  <SelectContent>

                    <SelectGroup>

                      {prodi.map(
                        (item) => (

                          <SelectItem
                            key={item.id}
                            value={String(
                              item.id
                            )}
                          >
                            {item.name}
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
            name="status"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="lecturer-status">
                  Status
                </FieldLabel>

                <Select
                  items={statusList}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="lecturer-status"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {statusList.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
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
        </div>

        <Controller
          control={control}
          name="jabatan"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="lecturer-jabatan">
                Jabatan
              </FieldLabel>

              <Select
                items={jabatanList}
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id="lecturer-jabatan"
                  aria-invalid={fieldState.invalid}
                >
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    {jabatanList.map((item) => (
                      <SelectItem
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
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
          <Checkbox id="lecturer-confirm-checkbox" checked={isConfirmed} onCheckedChange={(checked) => setIsConfirmed(checked === true)} />
          <FieldContent><FieldLabel htmlFor="lecturer-confirm-checkbox">Data yang saya masukkan sudah benar</FieldLabel><FieldDescription>Dengan mencentang kotak ini, saya menyatakan seluruh data dosen telah diperiksa dan benar.</FieldDescription></FieldContent>
        </Field>
      </FieldGroup>

      {isSubmitting && (
        <p className="text-sm text-muted-foreground">
          Menyimpan data dosen...
        </p>
      )}
    </form>
  )
}
