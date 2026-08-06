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
// import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { useState } from "react"

export function DialogForm() {
  const countries = [
    { label: "United States", value: "us" },
    { label: "United Kingdom", value: "uk" },
    { label: "Canada", value: "ca" },
  ]
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState<Date | undefined>(undefined)

  return (
    <Dialog>
      <form>
        <DialogTrigger render={<Button variant="outline">Add Mahasiswa</Button>} />
        <DialogContent className="sm:max-w-sm flex max-h-[85vh] flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Add Mahasiswa</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6">
          <FieldGroup>

            {/* ONE COLUMN */}
            <div className="grid grid-cols-2 gap-4">
              {/* NIM */}
              <Field>
                <FieldLabel htmlFor="form-name">NIM</FieldLabel>
                <Input
                  id="form-name"
                  type="text"
                  placeholder="21933212"
                  required
                />
              </Field>
              {/* USERNAME */}
              <Field>
                <FieldLabel htmlFor="form-name">Username</FieldLabel>
                <Input
                  id="form-name"
                  type="text"
                  placeholder="evilrabit123"
                  required
                />
              </Field>
            </div>


            {/* NAME */}
            <Field>
              <FieldLabel htmlFor="form-name">Name</FieldLabel>
              <Input
                id="form-name"
                type="text"
                placeholder="Evil Rabbit"
                required
              />
            </Field>
            {/* EMAIL */}
            <Field>
              <FieldLabel htmlFor="form-email">Email</FieldLabel>
              <Input id="form-email" type="email" placeholder="john@example.com" />
            </Field>

            {/* PASSWORD */}
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
              </div>
              <Input id="password" name="password" type="password" required />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="form-phone">Phone</FieldLabel>
                <Input id="form-phone" type="tel" placeholder="+1 (555) 123-4567" />
              </Field>
              {/* BIRTH DAY */}
              <Field className="mx-auto w-44">
              <FieldLabel htmlFor="date">Date of birth</FieldLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger render={<Button variant="outline" id="date" className="justify-start font-normal">{date ? date.toLocaleDateString() : "Select date"}</Button>} />
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
            </div>
            <Field>
              <FieldLabel htmlFor="form-address">Address</FieldLabel>
              <Input id="form-address" type="text" placeholder="123 Main St" />
            </Field>

            

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="form-phone">Semester</FieldLabel>
                <Input id="form-phone" type="tel" placeholder="+1 (555) 123-4567" />
              </Field>
              <Field>
                <FieldLabel htmlFor="form-country">Angkatan</FieldLabel>
                <Select items={countries} defaultValue="us">
                  <SelectTrigger id="form-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="form-phone">Status</FieldLabel>
                <Input id="form-phone" type="tel" placeholder="+1 (555) 123-4567" />
              </Field>
              <Field>
                <FieldLabel htmlFor="form-country">Wali Dosen</FieldLabel>
                <Select items={countries} defaultValue="us">
                  <SelectTrigger id="form-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  )
}
