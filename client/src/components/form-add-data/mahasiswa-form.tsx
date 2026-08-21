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
  formData, setFormData,
  fakultas, prodi, lecturers,
  selectedFakultasId, setSelectedFakultasId,
  selectedProdiId, setSelectedProdiId,
  selectedDosenId, setSelectedDosenId,
  date, setDate, open, setOpen,
  selectedFile, croppedImage, onFileChange, onResetPhoto, onCropped,
  isConfirmed, setIsConfirmed, errors,
}: MahasiswaFieldProps) {
  return (
    <FieldGroup>

      {/* NAMA LENGKAP */}
      <Field data-invalid={!!errors?.name}>
        <FieldLabel htmlFor="form-fullname">Nama Lengkap</FieldLabel>
        <Input
          id="form-fullname" type="text" placeholder="Evil Rabbit"
          value={formData.name} aria-invalid={!!errors?.name}
          onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
        />
        <FieldError>{errors?.name}</FieldError>
      </Field>

      {/* USERNAME + EMAIL */}
      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors?.username}>
          <FieldLabel htmlFor="form-username">Username</FieldLabel>
          <Input
            id="form-username" type="text" placeholder="evilrabit123"
            value={formData.username} aria-invalid={!!errors?.username}
            onChange={(e) => setFormData((f) => ({ ...f, username: e.target.value }))}
          />
          <FieldError>{errors?.username}</FieldError>
        </Field>
        <Field data-invalid={!!errors?.email}>
          <FieldLabel htmlFor="form-email">Email</FieldLabel>
          <Input
            id="form-email" type="email" placeholder="john@example.com"
            value={formData.email} aria-invalid={!!errors?.email}
            onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
          />
          <FieldError>{errors?.email}</FieldError>
        </Field>
      </div>

      {/* PASSWORD */}
      <Field data-invalid={!!errors?.password}>
        <FieldLabel htmlFor="form-password">Password</FieldLabel>
        <Input
          id="form-password" type="password"
          value={formData.password} aria-invalid={!!errors?.password}
          onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
        />
        <FieldError>{errors?.password}</FieldError>
      </Field>

      {/* JENIS KELAMIN + NOMOR TELEPON */}
      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors?.phoneNumber}>
          <FieldLabel htmlFor="form-gender">Jenis Kelamin</FieldLabel>
          <Select
            items={genderList}
            value={formData.gender}
            onValueChange={(value) => setFormData((f) => ({ ...f, gender: value ?? "" }))}
          >
            <SelectTrigger id="form-gender">
              <SelectValue placeholder="Pilih jenis kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {genderList.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="form-phone">Nomor Telepon</FieldLabel>
          <Input
            id="form-phone" type="tel" placeholder="+62 812-3456-7890"
            value={formData.phoneNumber} aria-invalid={!!errors?.phoneNumber}
            onChange={(e) => setFormData((f) => ({ ...f, phoneNumber: e.target.value }))}
          />
          <FieldError>{errors?.phoneNumber}</FieldError>
        </Field>
      </div>

      {/* TANGGAL LAHIR */}
      <Field data-invalid={!!errors?.address}>
        <FieldLabel htmlFor="date">Tanggal Lahir</FieldLabel>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger render={
            <Button variant="outline" type="button" id="date" className="w-full justify-start font-normal">
              {date ? date.toLocaleDateString() : "Pilih tanggal"}
            </Button>
          } />
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              defaultMonth={date}
              captionLayout="dropdown"
              onSelect={(date) => {
                setDate(date)
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>

      {/* ALAMAT */}
      <Field>
        <FieldLabel htmlFor="form-address">Alamat</FieldLabel>
        <Input
          id="form-address" type="text" placeholder="123 Main St"
          value={formData.address} aria-invalid={!!errors?.address}
          onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
        />
        <FieldError>{errors?.address}</FieldError>
      </Field>

      {/* FOTO PROFIL */}
      <Field>
        <FieldLabel htmlFor="form-photo">Foto Profil</FieldLabel>

        {!selectedFile && (
          <>
            <Input
              id="form-photo" accept="image/*" className="w-full"
              onChange={onFileChange} type="file"
            />
            <FieldDescription>Format JPG/PNG/WEBP, maks 1MB.</FieldDescription>
          </>
        )}

        {selectedFile && !croppedImage && (
          <ImageCrop
            aspect={1} file={selectedFile} maxImageSize={1024 * 1024}
            onChange={() => {}} onComplete={() => {}} onCrop={onCropped}
          >
            <ImageCropContent className="max-h-[50vh] w-auto object-contain" />
            <div className="flex items-center gap-2 mt-2">
              <ImageCropApply />
              <ImageCropReset />
              <Button onClick={onResetPhoto} size="icon" type="button" variant="ghost">
                <XIcon className="size-4" />
              </Button>
            </div>
          </ImageCrop>
        )}

        {selectedFile && croppedImage && (
          <div className="flex items-center gap-3">
            <img alt="Cropped avatar preview" src={croppedImage} className="size-24 rounded-full object-cover" />
            <Button onClick={onResetPhoto} size="icon" type="button" variant="ghost">
              <XIcon className="size-4" />
            </Button>
          </div>
        )}
      </Field>

      {/* NIM + FAKULTAS */}
      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors?.nim}>
          <FieldLabel htmlFor="form-nim">NIM</FieldLabel>
          <Input
            id="form-nim" type="text" placeholder="21933212"
            value={formData.nim} aria-invalid={!!errors?.nim}
            onChange={(e) => setFormData((f) => ({ ...f, nim: e.target.value }))}
          />
          <FieldError>{errors?.nim}</FieldError>
        </Field>
        <Field data-invalid={!!errors?.angkatan}>
          <FieldLabel htmlFor="form-fakultas">Fakultas</FieldLabel>
          <Select
            items={fakultas.map((f) => ({ label: f.name, value: f.id }))}
            value={selectedFakultasId}
            onValueChange={(value) => setSelectedFakultasId(value)}
          >
            <SelectTrigger id="form-fakultas" className="w-full max-w-xs">
              <SelectValue placeholder="Pilih fakultas" />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--anchor-width)] w-auto">
              <SelectGroup>
                {fakultas.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* PROGRAM STUDI + ANGKATAN */}
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="form-prodi">Program Studi</FieldLabel>
          <Select
            items={prodi.map((p) => ({ label: p.name, value: p.id }))}
            value={selectedProdiId}
            onValueChange={(value) => setSelectedProdiId(value)}
            disabled={!selectedFakultasId}
          >
            <SelectTrigger id="form-prodi">
              <SelectValue placeholder={selectedFakultasId ? "Pilih prodi" : "Pilih fakultas dulu"} />
            </SelectTrigger>
            <SelectContent className="min-w-[var(--anchor-width)] w-auto">
              <SelectGroup>
                {prodi.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="form-angkatan">Angkatan</FieldLabel>
          <Input
            id="form-angkatan" type="number" placeholder="2024"
            value={formData.angkatan} aria-invalid={!!errors?.angkatan}
            onChange={(e) => setFormData((f) => ({ ...f, angkatan: e.target.value }))}
          />
          <FieldError>{errors?.angkatan}</FieldError>
        </Field>
      </div>

      {/* SEMESTER + STATUS */}
      <div className="grid grid-cols-2 gap-4">
        <Field data-invalid={!!errors?.semester}>
          <FieldLabel htmlFor="form-semester">Semester</FieldLabel>
          <Input
            id="form-semester" type="number" placeholder="1"
            value={formData.semester} aria-invalid={!!errors?.semester}
            onChange={(e) => setFormData((f) => ({ ...f, semester: e.target.value }))}
          />
          <FieldError>{errors?.semester}</FieldError>
        </Field>
        <Field data-invalid={!!errors?.status}>
          <FieldLabel htmlFor="form-status">Status</FieldLabel>
          <Select
            items={statusList}
            value={formData.status}
            onValueChange={(value) => setFormData((f) => ({ ...f, status: value ?? "" }))}
          >
            <SelectTrigger id="form-status" aria-invalid={!!errors?.status}>
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {statusList.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FieldError>{errors?.status}</FieldError>
        </Field>
      </div>

      {/* DOSEN WALI */}
      <Field data-invalid={!!errors?.dosenId}>
        <FieldLabel htmlFor="form-dosen">Dosen Wali</FieldLabel>
        <Select
          items={lecturers.map((d) => ({ label: d.name, value: d.dosen.id }))}
          value={selectedDosenId}
          onValueChange={(value) => setSelectedDosenId(value)}
          disabled={!selectedProdiId}
        >
          <SelectTrigger id="form-dosen" aria-invalid={!!errors?.dosenId}>
            <SelectValue placeholder={selectedProdiId ? "Pilih dosen wali" : "Pilih prodi dulu"} />
          </SelectTrigger>
          <SelectContent className="min-w-[var(--anchor-width)] w-auto">
            <SelectGroup>
              {lecturers.map((d) => (
                <SelectItem key={d.dosen.id} value={d.dosen.id}>{d.name}</SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <FieldError>{errors?.dosenId}</FieldError>
      </Field>

      {/* KONFIRMASI DATA */}
      <Field orientation="horizontal" className="items-start gap-2 pt-2 pb-4">
        <Checkbox
          id="confirm-checkbox-desc"
          checked={isConfirmed}
          onCheckedChange={(checked) => setIsConfirmed(checked === true)}
        />
        <FieldContent>
          <FieldLabel htmlFor="confirm-checkbox-desc">
            Data yang saya masukkan sudah benar
          </FieldLabel>
          <FieldDescription>
            Dengan mencentang kotak ini, saya menyatakan bahwa seluruh data mahasiswa di atas sudah diperiksa dan benar.
          </FieldDescription>
        </FieldContent>
      </Field>
    </FieldGroup>
  )
}