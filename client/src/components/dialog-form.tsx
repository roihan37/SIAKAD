import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { Checkbox } from "./ui/checkbox"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getAllFakultas, getAllProdi } from "@/features/action/campusThunk"
import { getAllLecturers } from "@/features/action/usersThunk"

export function DialogForm() {
  const dispatch = useAppDispatch()
  const { fakultas, prodi } = useAppSelector((state) => state.campus)
  const { lecturers } = useAppSelector((state) => state.users)

  // pakai string | null (bukan number | null) — id dari Prisma biasanya cuid/uuid berupa string
  const [selectedFakultasId, setSelectedFakultasId] = useState<number | null>(null)
  const [selectedProdiId, setSelectedProdiId] = useState<number | null>(null)
  const [selectedDosenId, setSelectedDosenId] = useState<string | null>(null)

  // fetch semua fakultas sekali saat komponen mount
  useEffect(() => {
    dispatch(getAllFakultas())
  }, [dispatch])

  // fetch prodi setiap kali fakultas berubah; reset prodi & dosen yang sudah dipilih sebelumnya
  useEffect(() => {
    setSelectedProdiId(null)
    setSelectedDosenId(null)
    if (selectedFakultasId) {
      dispatch(getAllProdi({ fakultasId: selectedFakultasId }))
    }
    
  }, [selectedFakultasId, dispatch])

  // fetch dosen setiap kali prodi berubah; reset dosen yang sudah dipilih sebelumnya
  useEffect(() => {
    setSelectedDosenId(null)
    if (selectedProdiId) {
      dispatch(getAllLecturers({ prodiId: selectedProdiId }))
    }
  }, [selectedProdiId, dispatch])

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

  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [isConfirmed, setIsConfirmed] = useState(false)

  // console.log(prodi, '<<');
  
  return (
    <Dialog>
      <form>
        <DialogTrigger render={<Button variant="outline">Add Mahasiswa</Button>} />
        <DialogContent className="sm:max-w-sm flex max-h-[85vh] flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Add Mahasiswa</DialogTitle>
            <DialogDescription>
              Isi data mahasiswa baru di bawah ini. Klik simpan jika sudah selesai.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 mb-5">
            <FieldGroup>

              {/* NAMA LENGKAP */}
              <Field>
                <FieldLabel htmlFor="form-fullname">Nama Lengkap</FieldLabel>
                <Input id="form-fullname" type="text" placeholder="Evil Rabbit" required />
              </Field>

              {/* USERNAME + EMAIL */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="form-username">Username</FieldLabel>
                  <Input id="form-username" type="text" placeholder="evilrabit123" required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="form-email">Email</FieldLabel>
                  <Input id="form-email" type="email" placeholder="john@example.com" required />
                </Field>
              </div>

              {/* PASSWORD */}
              <Field>
                <FieldLabel htmlFor="form-password">Password</FieldLabel>
                <Input id="form-password" type="password" required />
              </Field>

              {/* JENIS KELAMIN + NOMOR TELEPON */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="form-gender">Jenis Kelamin</FieldLabel>
                  <Select items={genderList}>
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
                  <Input id="form-phone" type="tel" placeholder="+62 812-3456-7890" />
                </Field>
              </div>

              {/* TANGGAL LAHIR */}
              <Field>
                <FieldLabel htmlFor="date">Tanggal Lahir</FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger render={
                    <Button variant="outline" id="date" className="w-full justify-start font-normal">
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
                <Input id="form-address" type="text" placeholder="123 Main St" />
              </Field>

              {/* FOTO PROFIL */}
              <Field>
                <FieldLabel htmlFor="form-photo">Foto Profil</FieldLabel>
                <Input id="form-photo" type="file" accept="image/*" />
                <FieldDescription>Format JPG/PNG, maks 2MB.</FieldDescription>
              </Field>

              {/* NIM + FAKULTAS */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="form-nim">NIM</FieldLabel>
                  <Input id="form-nim" type="text" placeholder="21933212" required />
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
                  <Input id="form-angkatan" type="number" placeholder="2024" required />
                </Field>
              </div>

              {/* SEMESTER + STATUS */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="form-semester">Semester</FieldLabel>
                  <Input id="form-semester" type="number" placeholder="1" min={1} max={14} required />
                </Field>
                <Field>
                  <FieldLabel htmlFor="form-status">Status</FieldLabel>
                  <Select items={statusList}>
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
                  items={lecturers.map((d) => ({ label: d.name, value: d.id }))}
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
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {/* KONFIRMASI DATA — syarat wajib sebelum bisa Save */}
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
          </div>
          <DialogFooter className="p-6 pt-4 border-t">
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={!isConfirmed}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}