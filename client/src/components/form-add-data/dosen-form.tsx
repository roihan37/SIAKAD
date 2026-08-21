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

const genderList = [{ label: "Laki-laki", value: "Male" }, { label: "Perempuan", value: "Female" }]
const statusList = [
  { label: "Aktif", value: "Aktif" }, { label: "Cuti", value: "Cuti" },
  { label: "Lulus", value: "Lulus" }, { label: "Nonaktif", value: "Nonaktif" },
]
const jabatanList = [
  { label: "Dosen", value: "Dosen" }, { label: "Kaprodi", value: "Kaprodi" },
  { label: "Dekan", value: "Dekan" }, { label: "Rektor", value: "Rektor" },
]

export function DosenField({
  formData, setFormData, fakultas, prodi,
  selectedFakultasId, setSelectedFakultasId, selectedProdiId, setSelectedProdiId,
  date, setDate, open, setOpen, selectedFile, croppedImage,
  onFileChange, onResetPhoto, onCropped, isConfirmed, setIsConfirmed, errors,
}: DosenFieldProps) {
  return <FieldGroup>
    <Field data-invalid={!!errors?.name}>
      <FieldLabel htmlFor="lecturer-fullname">Nama Lengkap</FieldLabel>
      <Input id="lecturer-fullname" placeholder="Dr. Budi Santoso" value={formData.name} aria-invalid={!!errors?.name} onChange={(e) => setFormData((data) => ({ ...data, name: e.target.value }))} />
      <FieldError>{errors?.name}</FieldError>
    </Field>

    <div className="grid grid-cols-2 gap-4">
      <Field data-invalid={!!errors?.username}><FieldLabel htmlFor="lecturer-username">Username</FieldLabel>
        <Input id="lecturer-username" placeholder="budi.santoso" value={formData.username} aria-invalid={!!errors?.username} onChange={(e) => setFormData((data) => ({ ...data, username: e.target.value }))} />
        <FieldError>{errors?.username}</FieldError>
      </Field>
      <Field data-invalid={!!errors?.email}><FieldLabel htmlFor="lecturer-email">Email</FieldLabel>
        <Input id="lecturer-email" type="email" placeholder="budi@example.com" value={formData.email} aria-invalid={!!errors?.email} onChange={(e) => setFormData((data) => ({ ...data, email: e.target.value }))} />
        <FieldError>{errors?.email}</FieldError>
      </Field>
    </div>

    <Field data-invalid={!!errors?.password}><FieldLabel htmlFor="lecturer-password">Password</FieldLabel>
      <Input id="lecturer-password" type="password" value={formData.password} aria-invalid={!!errors?.password} onChange={(e) => setFormData((data) => ({ ...data, password: e.target.value }))} />
      <FieldError>{errors?.password}</FieldError>
    </Field>

    <div className="grid grid-cols-2 gap-4">
      <Field><FieldLabel htmlFor="lecturer-gender">Jenis Kelamin</FieldLabel>
        <Select items={genderList} value={formData.gender} onValueChange={(value) => setFormData((data) => ({ ...data, gender: value ?? "" }))}>
          <SelectTrigger id="lecturer-gender"><SelectValue placeholder="Pilih jenis kelamin" /></SelectTrigger>
          <SelectContent><SelectGroup>{genderList.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </Field>
      <Field data-invalid={!!errors?.phoneNumber}><FieldLabel htmlFor="lecturer-phone">Nomor Telepon</FieldLabel>
        <Input id="lecturer-phone" type="tel" placeholder="+62 812-3456-7890" value={formData.phoneNumber} aria-invalid={!!errors?.phoneNumber} onChange={(e) => setFormData((data) => ({ ...data, phoneNumber: e.target.value }))} />
        <FieldError>{errors?.phoneNumber}</FieldError>
      </Field>
    </div>

    <Field><FieldLabel htmlFor="lecturer-date">Tanggal Lahir</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button id="lecturer-date" variant="outline" type="button" className="w-full justify-start font-normal">{date ? date.toLocaleDateString() : "Pilih tanggal"}</Button>} />
        <PopoverContent className="w-auto overflow-hidden p-0" align="start"><Calendar mode="single" selected={date} defaultMonth={date} captionLayout="dropdown" onSelect={(selectedDate) => { setDate(selectedDate); setOpen(false) }} /></PopoverContent>
      </Popover>
    </Field>

    <Field data-invalid={!!errors?.address}><FieldLabel htmlFor="lecturer-address">Alamat</FieldLabel>
      <Input id="lecturer-address" placeholder="123 Main St" value={formData.address} aria-invalid={!!errors?.address} onChange={(e) => setFormData((data) => ({ ...data, address: e.target.value }))} />
      <FieldError>{errors?.address}</FieldError>
    </Field>

    <Field><FieldLabel htmlFor="lecturer-photo">Foto Profil</FieldLabel>
      {!selectedFile && <><Input id="lecturer-photo" accept="image/*" type="file" onChange={onFileChange} /><FieldDescription>Format JPG/PNG/WEBP, maks 1MB.</FieldDescription></>}
      {selectedFile && !croppedImage && <ImageCrop aspect={1} file={selectedFile} maxImageSize={1024 * 1024} onChange={() => {}} onComplete={() => {}} onCrop={onCropped}>
        <ImageCropContent className="max-h-[50vh] w-auto object-contain" />
        <div className="mt-2 flex items-center gap-2"><ImageCropApply /><ImageCropReset /><Button onClick={onResetPhoto} size="icon" type="button" variant="ghost"><XIcon className="size-4" /></Button></div>
      </ImageCrop>}
      {selectedFile && croppedImage && <div className="flex items-center gap-3"><img alt="Cropped avatar preview" src={croppedImage} className="size-24 rounded-full object-cover" /><Button onClick={onResetPhoto} size="icon" type="button" variant="ghost"><XIcon className="size-4" /></Button></div>}
    </Field>

    <div className="grid grid-cols-2 gap-4">
      <Field data-invalid={!!errors?.nidn}><FieldLabel htmlFor="lecturer-nidn">NIDN</FieldLabel>
        <Input id="lecturer-nidn" placeholder="0123456789" value={formData.nidn} aria-invalid={!!errors?.nidn} onChange={(e) => setFormData((data) => ({ ...data, nidn: e.target.value }))} />
        <FieldError>{errors?.nidn}</FieldError>
      </Field>
      <Field><FieldLabel htmlFor="lecturer-fakultas">Fakultas</FieldLabel>
        <Select items={fakultas.map((item) => ({ label: item.name, value: item.id }))} value={selectedFakultasId} onValueChange={(value) => setSelectedFakultasId(value)}>
          <SelectTrigger id="lecturer-fakultas"><SelectValue placeholder="Pilih fakultas" /></SelectTrigger>
          <SelectContent><SelectGroup>{fakultas.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </Field>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <Field data-invalid={!!errors?.prodiId}><FieldLabel htmlFor="lecturer-prodi">Program Studi</FieldLabel>
        <Select items={prodi.map((item) => ({ label: item.name, value: item.id }))} value={selectedProdiId} onValueChange={(value) => setSelectedProdiId(value)} disabled={!selectedFakultasId}>
          <SelectTrigger id="lecturer-prodi" aria-invalid={!!errors?.prodiId}><SelectValue placeholder={selectedFakultasId ? "Pilih prodi" : "Pilih fakultas dulu"} /></SelectTrigger>
          <SelectContent><SelectGroup>{prodi.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
        <FieldError>{errors?.prodiId}</FieldError>
      </Field>
      <Field><FieldLabel htmlFor="lecturer-status">Status</FieldLabel>
        <Select items={statusList} value={formData.status} onValueChange={(value) => setFormData((data) => ({ ...data, status: value ?? "" }))}>
          <SelectTrigger id="lecturer-status"><SelectValue placeholder="Pilih status" /></SelectTrigger>
          <SelectContent><SelectGroup>{statusList.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
        </Select>
      </Field>
    </div>

    <Field><FieldLabel htmlFor="lecturer-jabatan">Jabatan</FieldLabel>
      <Select items={jabatanList} value={formData.jabatan} onValueChange={(value) => setFormData((data) => ({ ...data, jabatan: value ?? "" }))}>
        <SelectTrigger id="lecturer-jabatan"><SelectValue placeholder="Pilih jabatan" /></SelectTrigger>
        <SelectContent><SelectGroup>{jabatanList.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectGroup></SelectContent>
      </Select>
    </Field>

    <Field orientation="horizontal" className="items-start gap-2 pt-2 pb-4">
      <Checkbox id="lecturer-confirm-checkbox" checked={isConfirmed} onCheckedChange={(checked) => setIsConfirmed(checked === true)} />
      <FieldContent><FieldLabel htmlFor="lecturer-confirm-checkbox">Data yang saya masukkan sudah benar</FieldLabel><FieldDescription>Dengan mencentang kotak ini, saya menyatakan seluruh data dosen telah diperiksa dan benar.</FieldDescription></FieldContent>
    </Field>
  </FieldGroup>
}
