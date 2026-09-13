import { useRef, useState } from "react"
import { isAxiosError } from "axios"
import { toast } from "sonner"
import { api } from "@/api/axios"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { Fakultas } from "@/types/campus"

export function FakultasDeleteDialog({ faculty, onClose, onDeleted }: {
    faculty: Fakultas
    onClose: () => void
    onDeleted: () => void
}) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const pending = useRef(false)
    const remove = async () => {
        if (pending.current) return
        pending.current = true
        setIsDeleting(true)
        setError(null)
        try {
            await api.delete(`/fakultas/${faculty.id}`)
        } catch (error) {
            const message = isAxiosError(error) ? error.response?.data?.message : undefined
            setError(typeof message === "string" ? message : "Gagal menghapus fakultas. Silakan coba lagi.")
            return
        } finally {
            pending.current = false
            setIsDeleting(false)
        }
        toast.success("Fakultas berhasil dihapus")
        onDeleted()
    }
    return (
        <Dialog open onOpenChange={(open) => { if (!open && !pending.current) onClose() }}>
            <DialogContent showCloseButton={!isDeleting} className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Hapus Fakultas?</DialogTitle>
                    <DialogDescription>
                        Hapus {faculty.name} ({faculty.kode})? Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                <DialogFooter>
                    <Button type="button" variant="outline" disabled={isDeleting} onClick={onClose}>Batal</Button>
                    <Button type="button" variant="destructive" disabled={isDeleting} onClick={() => void remove()}>
                        {isDeleting ? "Menghapus..." : "Hapus Fakultas"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
