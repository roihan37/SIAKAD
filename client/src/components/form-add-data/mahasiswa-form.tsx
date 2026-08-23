import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ImageCrop, ImageCropApply, ImageCropContent, ImageCropReset,
} from "@/components/kibo-ui/image-crop"
import { XIcon } from "lucide-react"
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "../ui/checkbox"
import type { MahasiswaFieldProps } from "@/types/props"
import { Controller } from "react-hook-form"

const genderList = [
  { label: "Laki-laki", value: "Male" },
  { label: "Perempuan", value: "Female" },
]
const statusList = [
  { label: "Aktif", value: "Aktif" },
  { label: "Cuti", value: "Cuti" },
  { label: "Lulus", value: "Lulus" },
  { label: "DO", value: "DO" },
]

export function MahasiswaField({
  form, onSubmit,
  fakultas, prodi,
  lecturers, selectedFakultasId,
  setSelectedFakultasId, selectedProdiId,
  setSelectedProdiId, selectedDosenId,
  setSelectedDosenId, date, setDate, open,
  setOpen, selectedFile,
  croppedImage, onFileChange, onResetPhoto,
  onCropped, isConfirmed,
  setIsConfirmed
}: MahasiswaFieldProps) {

  const {
    register,
    control,
    formState: { errors },
  } = form


  return (
    <form
      id="mahasiswa-form"
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <FieldGroup>

        {/* NAMA LENGKAP */}
        <Field data-invalid={!!errors?.name}>
          <FieldLabel htmlFor="form-fullname">Nama Lengkap</FieldLabel>
          <Input
            id="form-fullname"
            type="text"
            placeholder="Evil Rabbit"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          <FieldError>{errors.name?.message}
          </FieldError>
        </Field>

        {/* USERNAME + EMAIL */}
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.username}>
            <FieldLabel htmlFor="form-username">
              Username
            </FieldLabel>

            <Input
              id="form-username"
              type="text"
              placeholder="evilrabit123"
              aria-invalid={!!errors.username}
              {...register("username")}
            />

            <FieldError>
              {errors.username?.message}
            </FieldError>
          </Field>

          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="form-email">
              Email
            </FieldLabel>

            <Input
              id="form-email"
              type="email"
              placeholder="john@example.com"
              aria-invalid={!!errors.email}
              {...register("email")}
            />

            <FieldError>
              {errors.email?.message}
            </FieldError>
          </Field>
        </div>

        {/* PASSWORD */}
        <Field data-invalid={!!errors?.password}>
          <FieldLabel htmlFor="form-password">Password</FieldLabel>
          <Input
            id="form-password" type="password"
            {...register("password")}
            aria-invalid={!!errors?.password}
          />
          <FieldError>{errors?.password?.message}</FieldError>
        </Field>

        {/* JENIS KELAMIN + NOMOR TELEPON */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            control={control}
            name="gender"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-gender">
                  Jenis Kelamin
                </FieldLabel>

                <Select
                  items={genderList}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="form-gender"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {genderList.map((g) => (
                        <SelectItem
                          key={g.value}
                          value={g.value}
                        >
                          {g.label}
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
            <FieldLabel htmlFor="form-phone">
              Nomor Telepon
            </FieldLabel>

            <Input
              id="form-phone"
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

        {/* TANGGAL LAHIR */}
        <Controller
          control={control}
          name="birthDate"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="date">
                Tanggal Lahir
              </FieldLabel>

              <Popover
                open={open}
                onOpenChange={setOpen}
              >
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      type="button"
                      id="date"
                      className="w-full justify-start font-normal"
                      aria-invalid={fieldState.invalid}
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
                    defaultMonth={field.value}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      field.onChange(date)
                      setOpen(false)
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

        {/* ALAMAT */}
        <Field data-invalid={!!errors.address}>
          <FieldLabel htmlFor="form-address">
            Alamat
          </FieldLabel>

          <Input
            id="form-address"
            type="text"
            placeholder="123 Main St"
            aria-invalid={!!errors.address}
            {...register("address")}
          />

          <FieldError>
            {errors.address?.message}
          </FieldError>
        </Field>

        {/* FOTO PROFIL */}
        <Field>
          <FieldLabel htmlFor="form-photo">
            Foto Profil
          </FieldLabel>

          {!selectedFile && (
            <>
              <Input
                id="form-photo"
                accept="image/*"
                className="w-full"
                onChange={onFileChange}
                type="file"
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
              onCrop={onCropped}
            >
              <ImageCropContent className="max-h-[50vh] w-auto object-contain" />

              <div className="flex items-center gap-2 mt-2">
                <ImageCropApply />
                <ImageCropReset />

                <Button
                  onClick={onResetPhoto}
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
                onClick={onResetPhoto}
                size="icon"
                type="button"
                variant="ghost"
              >
                <XIcon className="size-4" />
              </Button>
            </div>
          )}
        </Field>

        {/* NIM + FAKULTAS */}
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.nim}>
            <FieldLabel htmlFor="form-nim">
              NIM
            </FieldLabel>

            <Input
              id="form-nim"
              type="text"
              placeholder="21933212"
              aria-invalid={!!errors.nim}
              {...register("nim")}
            />

            <FieldError>
              {errors.nim?.message}
            </FieldError>
          </Field>
          <Controller
            control={control}
            name="fakultasId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-fakultas">
                  Fakultas
                </FieldLabel>

                <Select
                  items={fakultas.map((f) => ({
                    label: f.name,
                    value: String(f.id),
                  }))}
                  value={
                    field.value
                      ? String(field.value)
                      : ""
                  }
                  onValueChange={(value) => {
                    field.onChange(Number(value))

                    // reset prodi ketika fakultas berubah
                    form.setValue("prodiId", 0)
                    form.setValue("dosenId", "")

                    setSelectedProdiId(null)
                    setSelectedDosenId(null)
                  }}
                >
                  <SelectTrigger
                    id="form-fakultas"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Pilih fakultas" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {fakultas.map((f) => (
                        <SelectItem
                          key={f.id}
                          value={String(f.id)}
                        >
                          {f.name}
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

        {/* PROGRAM STUDI + ANGKATAN */}
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="form-prodi">
              Program Studi
            </FieldLabel>

            <Select
              items={prodi.map((p) => ({
                label: p.name,
                value: p.id,
              }))}
              value={selectedProdiId}
              onValueChange={(value) =>
                setSelectedProdiId(value)
              }
              disabled={!selectedFakultasId}
            >
              <SelectTrigger id="form-prodi">
                <SelectValue
                  placeholder={
                    selectedFakultasId
                      ? "Pilih prodi"
                      : "Pilih fakultas dulu"
                  }
                />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {prodi.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field data-invalid={!!errors.angkatan}>
            <FieldLabel htmlFor="form-angkatan">
              Angkatan
            </FieldLabel>

            <Input
              id="form-angkatan"
              type="number"
              placeholder="2024"
              aria-invalid={!!errors.angkatan}
              {...register("angkatan")}
            />

            <FieldError>
              {errors.angkatan?.message}
            </FieldError>
          </Field>
        </div>

        {/* SEMESTER + STATUS */}
        <div className="grid grid-cols-2 gap-4">
          <Field data-invalid={!!errors.semester}>
            <FieldLabel htmlFor="form-semester">
              Semester
            </FieldLabel>

            <Input
              id="form-semester"
              type="number"
              placeholder="1"
              aria-invalid={!!errors.semester}
              {...register("semester")}
            />

            <FieldError>
              {errors.semester?.message}
            </FieldError>
          </Field>

          <Controller
            control={control}
            name="status"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="form-status">
                  Status
                </FieldLabel>

                <Select
                  items={statusList}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger
                    id="form-status"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {statusList.map((s) => (
                        <SelectItem
                          key={s.value}
                          value={s.value}
                        >
                          {s.label}
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

        {/* DOSEN WALI */}
        <Field data-invalid={!!errors.dosenId}>
          <FieldLabel htmlFor="form-dosen">
            Dosen Wali
          </FieldLabel>

          <Select
            items={lecturers.map((d) => ({
              label: d.name,
              value: d.dosen.id,
            }))}
            value={selectedDosenId}
            onValueChange={(value) =>
              setSelectedDosenId(value)
            }
            disabled={!selectedProdiId}
          >
            <SelectTrigger
              id="form-dosen"
              aria-invalid={!!errors.dosenId}
            >
              <SelectValue
                placeholder={
                  selectedProdiId
                    ? "Pilih dosen wali"
                    : "Pilih prodi dulu"
                }
              />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {lecturers.map((d) => (
                  <SelectItem
                    key={d.dosen.id}
                    value={d.dosen.id}
                  >
                    {d.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <FieldError>
            {errors.dosenId?.message}
          </FieldError>
        </Field>

        {/* KONFIRMASI DATA */}
        <Field
          orientation="horizontal"
          className="items-start gap-2 pt-2 pb-4"
        >
          <Checkbox
            id="confirm-checkbox-desc"
            checked={isConfirmed}
            onCheckedChange={(checked) =>
              setIsConfirmed(checked === true)
            }
          />

          <FieldContent>
            <FieldLabel htmlFor="confirm-checkbox-desc">
              Data yang saya masukkan sudah benar
            </FieldLabel>

            <FieldDescription>
              Dengan mencentang kotak ini, saya menyatakan bahwa
              seluruh data mahasiswa di atas sudah diperiksa dan benar.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>
    </form>
  )
}