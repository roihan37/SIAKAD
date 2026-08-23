import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
  ImageCropReset,
} from "@/components/kibo-ui/image-crop"

import { XIcon } from "lucide-react"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"

import { Input } from "@/components/ui/input"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Checkbox } from "../ui/checkbox"

import { Controller, useForm } from "react-hook-form"

import {
  mahasiswaSchema,
  type MahasiswaFormInput,
  type MahasiswaFormValues,
} from "@/schemas"

import { zodResolver } from "@hookform/resolvers/zod"

import { useEffect, useState, type ChangeEvent } from "react"

import {
  createStudent,
  getAllLecturers,
  getAvatarUploadUrl,
} from "@/features/action/usersThunk"

import {
  getAllProdi,
} from "@/features/action/campusThunk"

import { useAppDispatch } from "@/hooks/redux"

import type { MahasiswaFieldProps } from "@/types/props"


const genderList = [
  {
    label: "Laki-laki",
    value: "Male",
  },
  {
    label: "Perempuan",
    value: "Female",
  },
]


const statusList = [
  {
    label: "Aktif",
    value: "Aktif",
  },
  {
    label: "Cuti",
    value: "Cuti",
  },
  {
    label: "Lulus",
    value: "Lulus",
  },
  {
    label: "DO",
    value: "DO",
  },
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


export function MahasiswaField({
  fakultas,
  prodi,
  lecturers,

  isConfirmed,
  setIsConfirmed,

  onSuccess,
  onError,
}: MahasiswaFieldProps) {

  const dispatch = useAppDispatch()


  // =====================================================
  // FORM
  // =====================================================

  const studentForm = useForm<
    MahasiswaFormInput,
    unknown,
    MahasiswaFormValues
  >({
    resolver: zodResolver(mahasiswaSchema),

    mode: "onChange",

    defaultValues: {
      nim: "",
      name: "",
      email: "",
      username: "",
      password: "",

      gender: undefined,

      phoneNumber: "",
      address: "",
      birthDate: undefined,

      angkatan: 0,
      semester: 1,
      status: "Aktif",

      fakultasId: 0,
      prodiId: 0,
      dosenId: "",
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
  } = studentForm


  // =====================================================
  // FORM WATCH
  // =====================================================

  const fakultasId = watch("fakultasId")
  const prodiId = watch("prodiId")


  // =====================================================
  // UI STATE
  // =====================================================

  const [datePickerOpen, setDatePickerOpen] =
    useState(false)

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  const [croppedImage, setCroppedImage] =
    useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] =
    useState(false)


  // =====================================================
  // DEPENDENT DATA
  // Fakultas → Prodi
  // =====================================================

  useEffect(() => {

    if (!fakultasId) {
      setValue("prodiId", 0)
      setValue("dosenId", "")
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


  // =====================================================
  // DEPENDENT DATA
  // Prodi → Dosen Wali
  // =====================================================

  useEffect(() => {

    if (!prodiId) {
      setValue("dosenId", "")
      return
    }

    dispatch(
      getAllLecturers({
        prodiId,
      })
    )

  }, [
    prodiId,
    dispatch,
    setValue,
  ])


  // =====================================================
  // FILE
  // =====================================================

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


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
  data: MahasiswaFormValues
) => {
  try {
    setIsSubmitting(true)

    let avatarKey: string | undefined

    // ==========================================
    // 1. UPLOAD AVATAR JIKA ADA
    // ==========================================

    if (croppedImage) {
      const blob = dataUrlToBlob(croppedImage)

      const contentType =
        blob.type || "image/png"

      const {
        uploadUrl,
        key,
      } = await dispatch(
        getAvatarUploadUrl(contentType)
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

    // ==========================================
    // 2. CREATE MAHASISWA
    // ==========================================

    await dispatch(
      createStudent({
        ...data,
        birthDate:
          data.birthDate?.toISOString(),
        avatarKey,
      })
    ).unwrap()

    // ==========================================
    // 3. RESET
    // ==========================================

    reset()

    setSelectedFile(null)
    setCroppedImage(null)
    setDatePickerOpen(false)
    setIsConfirmed(false)

    // ==========================================
    // 4. SUCCESS
    // ==========================================

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


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <form
      id="mahasiswa-form"
      onSubmit={
        studentForm.handleSubmit(
          handleSubmit
        )
      }
    >

      <FieldGroup>

        {/* =================================================
            NAMA
        ================================================= */}

        <Field
          data-invalid={
            !!errors.name
          }
        >

          <FieldLabel htmlFor="form-fullname">
            Nama Lengkap
          </FieldLabel>

          <Input
            id="form-fullname"
            type="text"
            placeholder="Nama lengkap"
            aria-invalid={
              !!errors.name
            }
            {...register("name")}
          />

          <FieldError>
            {errors.name?.message}
          </FieldError>

        </Field>


        {/* =================================================
            USERNAME + EMAIL
        ================================================= */}

        <div className="grid grid-cols-2 gap-4">

          <Field
            data-invalid={
              !!errors.username
            }
          >

            <FieldLabel htmlFor="form-username">
              Username
            </FieldLabel>

            <Input
              id="form-username"
              type="text"
              placeholder="username"
              aria-invalid={
                !!errors.username
              }
              {...register("username")}
            />

            <FieldError>
              {errors.username?.message}
            </FieldError>

          </Field>


          <Field
            data-invalid={
              !!errors.email
            }
          >

            <FieldLabel htmlFor="form-email">
              Email
            </FieldLabel>

            <Input
              id="form-email"
              type="email"
              placeholder="email@example.com"
              aria-invalid={
                !!errors.email
              }
              {...register("email")}
            />

            <FieldError>
              {errors.email?.message}
            </FieldError>

          </Field>

        </div>


        {/* =================================================
            PASSWORD
        ================================================= */}

        <Field
          data-invalid={
            !!errors.password
          }
        >

          <FieldLabel htmlFor="form-password">
            Password
          </FieldLabel>

          <Input
            id="form-password"
            type="password"
            aria-invalid={
              !!errors.password
            }
            {...register("password")}
          />

          <FieldError>
            {errors.password?.message}
          </FieldError>

        </Field>


        {/* =================================================
            GENDER + PHONE
        ================================================= */}

        <div className="grid grid-cols-2 gap-4">

          <Controller
            control={control}
            name="gender"

            render={({
              field,
              fieldState,
            }) => (

              <Field
                data-invalid={
                  fieldState.invalid
                }
              >

                <FieldLabel htmlFor="form-gender">
                  Jenis Kelamin
                </FieldLabel>

                <Select
                  items={genderList}
                  value={field.value}
                  onValueChange={
                    field.onChange
                  }
                >

                  <SelectTrigger
                    id="form-gender"
                    aria-invalid={
                      fieldState.invalid
                    }
                  >

                    <SelectValue
                      placeholder="Pilih jenis kelamin"
                    />

                  </SelectTrigger>

                  <SelectContent>

                    <SelectGroup>

                      {genderList.map(
                        (gender) => (

                          <SelectItem
                            key={gender.value}
                            value={gender.value}
                          >
                            {gender.label}
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


          <Field
            data-invalid={
              !!errors.phoneNumber
            }
          >

            <FieldLabel htmlFor="form-phone">
              Nomor Telepon
            </FieldLabel>

            <Input
              id="form-phone"
              type="tel"
              placeholder="+62 812-3456-7890"
              aria-invalid={
                !!errors.phoneNumber
              }
              {...register("phoneNumber")}
            />

            <FieldError>
              {errors.phoneNumber?.message}
            </FieldError>

          </Field>

        </div>


        {/* =================================================
            TANGGAL LAHIR
        ================================================= */}

        <Controller
          control={control}
          name="birthDate"

          render={({
            field,
            fieldState,
          }) => (

            <Field
              data-invalid={
                fieldState.invalid
              }
            >

              <FieldLabel htmlFor="date">
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
                      variant="outline"
                      type="button"
                      id="date"
                      className="w-full justify-start font-normal"
                      aria-invalid={
                        fieldState.invalid
                      }
                    >

                      {field.value
                        ? field.value.toLocaleDateString()
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


        {/* =================================================
            ALAMAT
        ================================================= */}

        <Field
          data-invalid={
            !!errors.address
          }
        >

          <FieldLabel htmlFor="form-address">
            Alamat
          </FieldLabel>

          <Input
            id="form-address"
            type="text"
            placeholder="Alamat lengkap"
            aria-invalid={
              !!errors.address
            }
            {...register("address")}
          />

          <FieldError>
            {errors.address?.message}
          </FieldError>

        </Field>


        {/* =================================================
            FOTO PROFIL
        ================================================= */}

        <Field>

          <FieldLabel htmlFor="form-photo">
            Foto Profil
          </FieldLabel>


          {!selectedFile && (

            <>

              <Input
                id="form-photo"
                type="file"
                accept="image/*"
                className="w-full"
                onChange={
                  handleFileChange
                }
              />

              <FieldDescription>
                Format JPG/PNG/WEBP,
                maks 1MB.
              </FieldDescription>

            </>

          )}


          {selectedFile &&
            !croppedImage && (

              <ImageCrop
                aspect={1}
                file={selectedFile}
                maxImageSize={
                  1024 * 1024
                }

                onChange={() => {}}
                onComplete={() => {}}

                onCrop={
                  setCroppedImage
                }
              >

                <ImageCropContent
                  className="max-h-[50vh] w-auto object-contain"
                />

                <div className="flex items-center gap-2 mt-2">

                  <ImageCropApply />

                  <ImageCropReset />

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={
                      handleResetPhoto
                    }
                  >

                    <XIcon className="size-4" />

                  </Button>

                </div>

              </ImageCrop>

            )}


          {selectedFile &&
            croppedImage && (

              <div className="flex items-center gap-3">

                <img
                  src={croppedImage}
                  alt="Preview foto profil"
                  className="size-24 rounded-full object-cover"
                />

                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={
                    handleResetPhoto
                  }
                >

                  <XIcon className="size-4" />

                </Button>

              </div>

            )}

        </Field>


        {/* =================================================
            NIM + FAKULTAS
        ================================================= */}

        <div className="grid grid-cols-2 gap-4">

          <Field
            data-invalid={
              !!errors.nim
            }
          >

            <FieldLabel htmlFor="form-nim">
              NIM
            </FieldLabel>

            <Input
              id="form-nim"
              type="text"
              placeholder="21933212"
              aria-invalid={
                !!errors.nim
              }
              {...register("nim")}
            />

            <FieldError>
              {errors.nim?.message}
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

                    setValue(
                      "dosenId",
                      ""
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


        {/* =================================================
            PRODI + ANGKATAN
        ================================================= */}

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

                    setValue(
                      "dosenId",
                      ""
                    )

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


          <Field
            data-invalid={
              !!errors.angkatan
            }
          >

            <FieldLabel htmlFor="form-angkatan">
              Angkatan
            </FieldLabel>

            <Input
              id="form-angkatan"
              type="number"
              placeholder="2024"
              aria-invalid={
                !!errors.angkatan
              }

              {...register(
                "angkatan",
                {
                  valueAsNumber: true,
                }
              )}
            />

            <FieldError>
              {errors.angkatan?.message}
            </FieldError>

          </Field>

        </div>


        {/* =================================================
            SEMESTER + STATUS
        ================================================= */}

        <div className="grid grid-cols-2 gap-4">

          <Field
            data-invalid={
              !!errors.semester
            }
          >

            <FieldLabel htmlFor="form-semester">
              Semester
            </FieldLabel>

            <Input
              id="form-semester"
              type="number"
              placeholder="1"
              aria-invalid={
                !!errors.semester
              }

              {...register(
                "semester",
                {
                  valueAsNumber: true,
                }
              )}
            />

            <FieldError>
              {errors.semester?.message}
            </FieldError>

          </Field>


          <Controller
            control={control}
            name="status"

            render={({
              field,
              fieldState,
            }) => (

              <Field
                data-invalid={
                  fieldState.invalid
                }
              >

                <FieldLabel htmlFor="form-status">
                  Status
                </FieldLabel>

                <Select
                  items={statusList}
                  value={field.value}
                  onValueChange={
                    field.onChange
                  }
                >

                  <SelectTrigger
                    id="form-status"
                    aria-invalid={
                      fieldState.invalid
                    }
                  >

                    <SelectValue
                      placeholder="Pilih status"
                    />

                  </SelectTrigger>


                  <SelectContent>

                    <SelectGroup>

                      {statusList.map(
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

        </div>


        {/* =================================================
            DOSEN WALI
        ================================================= */}

        <Controller
          control={control}
          name="dosenId"

          render={({
            field,
            fieldState,
          }) => (

            <Field
              data-invalid={
                fieldState.invalid
              }
            >

              <FieldLabel htmlFor="form-dosen">
                Dosen Wali
              </FieldLabel>


              <Select

                items={lecturers.map(
                  (lecturer) => ({
                    label:
                      lecturer.name,
                    value:
                      lecturer.dosen.id,
                  })
                )}

                value={
                  field.value || ""
                }

                onValueChange={
                  field.onChange
                }

                disabled={!prodiId}
              >

                <SelectTrigger
                  id="form-dosen"
                  aria-invalid={
                    fieldState.invalid
                  }
                >

                  <SelectValue
                    placeholder={
                      prodiId
                        ? "Pilih dosen wali"
                        : "Pilih prodi dulu"
                    }
                  />

                </SelectTrigger>


                <SelectContent>

                  <SelectGroup>

                    {lecturers.map(
                      (lecturer) => (

                        <SelectItem
                          key={
                            lecturer.dosen.id
                          }
                          value={
                            lecturer.dosen.id
                          }
                        >
                          {lecturer.name}
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


        {/* =================================================
            KONFIRMASI
        ================================================= */}

        <Field
          orientation="horizontal"
          className="items-start gap-2 pt-2 pb-4"
        >

          <Checkbox
            id="confirm-checkbox-desc"

            checked={isConfirmed}

            onCheckedChange={(
              checked
            ) => {

              setIsConfirmed(
                checked === true
              )

            }}
          />

          <FieldContent>

            <FieldLabel
              htmlFor="confirm-checkbox-desc"
            >
              Data yang saya masukkan
              sudah benar
            </FieldLabel>

            <FieldDescription>
              Dengan mencentang kotak ini,
              saya menyatakan bahwa seluruh
              data mahasiswa di atas sudah
              diperiksa dan benar.
            </FieldDescription>

          </FieldContent>

        </Field>

      </FieldGroup>

      {isSubmitting && (
        <p className="text-sm text-muted-foreground">
          Menyimpan data mahasiswa...
        </p>
      )}

    </form>
  )
}