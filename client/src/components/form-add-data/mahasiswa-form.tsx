import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ImageCrop, ImageCropApply, ImageCropContent, ImageCropReset,
} from "@/components/kibo-ui/image-crop"
import { XIcon } from "lucide-react"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
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
  isConfirmed, setIsConfirmed,
  submitError,
}: MahasiswaFieldProps) {
  return (
    <FieldGroup>

      {/* NAMA LENGKAP */}
      <Field>
        <FieldLabel htmlFor="form-fullname">Nama Lengkap</FieldLabel>
        <Input
          id="form-fullname" type="text" placeholder="Evil Rabbit" required
          value={formData.name}
          onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
        />
      </Field>

      {/* USERNAME + EMAIL */}
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="form-username">Username</FieldLabel>
          <Input
            id="form-username" type="text" placeholder="evilrabit123" required
            value={formData.username}
            onChange={(e) => setFormData((f) => ({ ...f, username: e.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="form-email">Email</FieldLabel>
          <Input
            id="form-email" type="email" placeholder="john@example.com" required
            value={formData.email}
            onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
          />
        </Field>
      </div>

      {/* PASSWORD */}
      <Field>
        <FieldLabel htmlFor="form-password">Password</FieldLabel>
        <Input
          id="form-password" type="password" required
          value={formData.password}
          onChange={(e) => setFormData((f) => ({ ...f, password: e.target.value }))}
        />
      </Field>

      {/* JENIS KELAMIN + NOMOR TELEPON */}
      <div className="grid grid-cols-2 gap-4">
        <Field>
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
            value={formData.phoneNumber}
            onChange={(e) => setFormData((f) => ({ ...f, phoneNumber: e.target.value }))}
          />
        </Field>
      </div>

      {/* TANGGAL LAHIR */}
      <Field>
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
          value={formData.address}
          onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
        />
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
        <Field>
          <FieldLabel htmlFor="form-nim">NIM</FieldLabel>
          <Input
            id="form-nim" type="text" placeholder="21933212" required
            value={formData.nim}
            onChange={(e) => setFormData((f) => ({ ...f, nim: e.target.value }))}
          />
        </Field>
        <Field>
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
            id="form-angkatan" type="number" placeholder="2024" required
            value={formData.angkatan}
            onChange={(e) => setFormData((f) => ({ ...f, angkatan: e.target.value }))}
          />
        </Field>
      </div>

      {/* SEMESTER + STATUS */}
      <div className="grid grid-cols-2 gap-4">
        <Field>
          <FieldLabel htmlFor="form-semester">Semester</FieldLabel>
          <Input
            id="form-semester" type="number" placeholder="1" min={1} max={14} required
            value={formData.semester}
            onChange={(e) => setFormData((f) => ({ ...f, semester: e.target.value }))}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="form-status">Status</FieldLabel>
          <Select
            items={statusList}
            value={formData.status}
            onValueChange={(value) => setFormData((f) => ({ ...f, status: value ?? "" }))}
          >
            <SelectTrigger id="form-status">
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
        </Field>
      </div>

      {/* DOSEN WALI */}
      <Field>
        <FieldLabel htmlFor="form-dosen">Dosen Wali</FieldLabel>
        <Select
          items={lecturers.map((d) => ({ label: d.name, value: d.dosen.id }))}
          value={selectedDosenId}
          onValueChange={(value) => setSelectedDosenId(value)}
          disabled={!selectedProdiId}
        >
          <SelectTrigger id="form-dosen">
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