import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { api } from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { fakultasSchema, type FakultasFormValues } from "@/schemas/fakultas.schema"
import type { Fakultas } from "@/types/campus"

export function FakultasEditDialog({ faculty, onClose, onSaved }: {
    faculty: Fakultas
    onClose: () => void
    onSaved: () => void
}) {
    const [serverError, setServerError] = useState<string | null>(null)
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FakultasFormValues>({
        resolver: zodResolver(fakultasSchema),
        defaultValues: { kode: faculty.kode, name: faculty.name },
    })
    const submit = async (values: FakultasFormValues) => {
        setServerError(null)
        try {
            await api.put(`/fakultas/${faculty.id}`, values)
        } catch (error) {
            const message = isAxiosError(error) ? error.response?.data?.message : undefined
            setServerError(typeof message === "string" ? message : "Gagal memperbarui fakultas. Silakan coba lagi.")
            return
        }
        toast.success("Fakultas berhasil diperbarui")
        onSaved()
    }
    return (
        <Dialog open onOpenChange={(open) => { if (!open && !isSubmitting) onClose() }}>
            <DialogContent showCloseButton={!isSubmitting} className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Fakultas</DialogTitle>
                    <DialogDescription>Perbarui kode dan nama fakultas.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(submit)} className="space-y-5">
                    <FieldGroup>
                        <Field data-invalid={!!errors.kode}>
                            <FieldLabel htmlFor="edit-fakultas-kode">Kode Fakultas</FieldLabel>
                            <Input id="edit-fakultas-kode" disabled={isSubmitting} aria-invalid={!!errors.kode} {...register("kode")} />
                            <FieldError>{errors.kode?.message}</FieldError>
                        </Field>
                        <Field data-invalid={!!errors.name}>
                            <FieldLabel htmlFor="edit-fakultas-name">Nama Fakultas</FieldLabel>
                            <Input id="edit-fakultas-name" disabled={isSubmitting} aria-invalid={!!errors.name} {...register("name")} />
                            <FieldError>{errors.name?.message}</FieldError>
                        </Field>
                    </FieldGroup>
                    {serverError && <p role="alert" className="text-sm text-destructive">{serverError}</p>}
                    <DialogFooter>
                        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>Batal</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
