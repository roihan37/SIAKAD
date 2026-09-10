import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, TrashIcon } from "lucide-react"
import { toast } from "sonner"
import type { Mahasiswa } from "@/types/campus"

import { DataTable } from "@/components/tables/data-table"
import { createMhsColumns } from "@/components/tables/column/mhsColumns"
import { bulkMutateStudents, type BulkStudentAction, deleteStudent, getAllStudents } from "@/features/action/mahasiswaThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/mahasiswaSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { RowSelectionState, SortingState } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"



export default function MahasiswaPage() {
    const dispatch = useAppDispatch()
    const { students,
        deletingStudentId,
        isBulkMutating,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder,
    } = useAppSelector((state) => state.students)


    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [bulkKind, setBulkKind] = useState<"delete" | "status" | null>(null)
    const [bulkStatus, setBulkStatus] = useState<"Aktif" | "Cuti" | "Lulus" | "Nonaktif">("Aktif")
    const [bulkReason, setBulkReason] = useState("")
    const bulkLock = useRef(false)
    const selectedStudents = students.filter((student) => rowSelection[student.id])
    const changedStudents = selectedStudents.filter((student) => student.mahasiswa.status !== bulkStatus)
    const clearSelection = () => setRowSelection({})
    const openBulk = (kind: "delete" | "status") => {
        setBulkReason("")
        setBulkKind(kind)
    }
    const handleBulk = async () => {
        if (!bulkKind || !selectedStudents.length || bulkLock.current || isBulkMutating) return
        if (bulkKind === "status" && (!bulkReason.trim() || !changedStudents.length)) return
        bulkLock.current = true
        const input: BulkStudentAction = bulkKind === "delete"
            ? { kind: "delete", ids: selectedStudents.map((student) => student.id) }
            : { kind: "status", ids: changedStudents.map((student) => student.id), status: bulkStatus, statusReason: bulkReason.trim() }
        try {
            await dispatch(bulkMutateStudents(input)).unwrap()
            clearSelection()
            setBulkKind(null)
            if (bulkKind === "delete" && selectedStudents.length === students.length && page > 1) {
                dispatch(setPage(page - 1))
            } else {
                try {
                    await dispatch(getAllStudents({ page, limit: 10, search, sortBy, sortOrder })).unwrap()
                } catch {
                    toast.error("Perubahan tersimpan, tetapi daftar gagal dimuat ulang. Silakan muat ulang halaman.")
                }
            }
        } catch {
            // Middleware memperbarui satu toast; pilihan tetap tersedia untuk mencoba lagi.
        } finally {
            bulkLock.current = false
        }
    }

    const [studentToDelete, setStudentToDelete] = useState<Mahasiswa | null>(null)
    const isDeleting = deletingStudentId !== null
    const requestDelete = useCallback((student: Mahasiswa) => {
        setStudentToDelete(student)
    }, [setStudentToDelete])
    const columns = useMemo(() => createMhsColumns(requestDelete), [requestDelete])

    const handleDelete = async () => {
        if (!studentToDelete || isDeleting) return
        try {
            await dispatch(deleteStudent(studentToDelete.id)).unwrap()
        } catch {
            // Toast kegagalan penghapusan ditangani middleware Redux.
            return
        }
        setStudentToDelete(null)
        if (students.length === 1 && page > 1) {
            dispatch(setPage(page - 1))
        } else {
            try {
                await dispatch(getAllStudents({ page, limit: 10, search, sortBy, sortOrder })).unwrap()
            } catch {
                toast.error("Mahasiswa sudah dihapus, tetapi daftar gagal dimuat ulang. Silakan muat ulang halaman.")
            }
        }
    }

    const [searchInput, setSearchInput] = useState(search)
    const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []

    const handleSortingChange = (next: SortingState) => {
        if (next.length === 0) {
            dispatch(setSorting({ sortBy: "name", sortOrder: "asc" }))
            return
        }
        
        const { id, desc } = next[0]
        dispatch(setSorting({ sortBy: id, sortOrder: desc ? "desc" : "asc" }))
    }

        useEffect(() => {
            const timeout = setTimeout(() => {
                dispatch(setSearch(searchInput))
            }, 400)
            return () => clearTimeout(timeout)
        }, [searchInput, dispatch])

        useEffect(() => {
            dispatch(getAllStudents({ page, limit: 10, search, sortBy, sortOrder }));
        }, [dispatch, page, search, sortBy, sortOrder]);
        return (
            <>
                <div className="container mx-auto mt-4">
                    <div className="text-2xl">
                        Data Mahasiswa
                    </div>
                    <DataTable
                        columns={columns}
                        data={students}
                        searchValue={searchInput}
                        onSearchChange={(value) => { clearSelection(); setSearchInput(value) }}
                        searchPlaceholder="Cari nama atau NIM mahasiswa..."
                        rowSelection={rowSelection}
                        onRowSelectionChange={setRowSelection}
                        getRowId={(student) => student.id}
                        selectionDisabled={isBulkMutating}
                        toolbar={selectedStudents.length > 0 && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4" role="region" aria-label="Aksi mahasiswa terpilih">
                            <div className="mr-auto"><p className="text-sm font-semibold" aria-live="polite">{selectedStudents.length} mahasiswa dipilih</p><p className="text-xs text-muted-foreground">Pilihan hanya pada halaman ini.</p></div>
                            <Button variant="outline" onClick={() => openBulk("status")} disabled={isBulkMutating}>Ubah status</Button>
                            <Button variant="destructive" onClick={() => openBulk("delete")} disabled={isBulkMutating}><TrashIcon /> Hapus</Button>
                            <Button variant="ghost" onClick={clearSelection} disabled={isBulkMutating}>Batal pilih</Button>
                        </div>}
                        pageIndex={page - 1}
                        pageCount={totalPages}
                        onPageChange={(newIndex) => { clearSelection(); dispatch(setPage(newIndex + 1)) }}
                        sorting={sorting} 
                        onSortingChange={(next) => { clearSelection(); handleSortingChange(next) }}
                    />
                </div>
                <Dialog open={bulkKind !== null} onOpenChange={(open) => { if (!open && !isBulkMutating) setBulkKind(null) }}>
                    <DialogContent showCloseButton={!isBulkMutating} aria-busy={isBulkMutating}>
                        <DialogHeader>
                            <DialogTitle>{bulkKind === "delete" ? "Hapus mahasiswa terpilih?" : "Ubah status mahasiswa"}</DialogTitle>
                            <DialogDescription>{bulkKind === "delete" ? `Akun dan data akademik terkait dari ${selectedStudents.length} mahasiswa akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.` : `Tentukan status baru untuk ${selectedStudents.length} mahasiswa. Alasan akan dicatat pada riwayat masing-masing mahasiswa.`}</DialogDescription>
                        </DialogHeader>
                        <ul className="max-h-36 space-y-2 overflow-y-auto rounded-lg border bg-muted/30 p-3 text-sm" aria-label="Mahasiswa yang dipilih">
                            {selectedStudents.map((student) => <li key={student.id} className="flex flex-wrap justify-between gap-x-3"><span className="font-medium">{student.name}</span><span className="text-muted-foreground">{student.mahasiswa.nim} · {student.mahasiswa.status}</span></li>)}
                        </ul>
                        {bulkKind === "status" && <div className="space-y-4">
                            <fieldset disabled={isBulkMutating}><legend className="mb-2 text-sm font-medium">Status baru</legend><div className="grid grid-cols-2 gap-2">
                                {(["Aktif", "Cuti", "Lulus", "Nonaktif"] as const).map((status) => <label key={status} className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${bulkStatus === status ? "border-primary bg-primary/5 font-medium" : ""}`}><input type="radio" name="bulk-status" value={status} checked={bulkStatus === status} onChange={() => setBulkStatus(status)} className="accent-primary" />{status === "Nonaktif" ? "Nonaktif" : status}</label>)}
                            </div></fieldset>
                            <div className="space-y-2"><label htmlFor="bulk-status-reason" className="text-sm font-medium">Alasan perubahan <span className="text-destructive">*</span></label><textarea id="bulk-status-reason" required maxLength={1000} disabled={isBulkMutating} value={bulkReason} onChange={(event) => setBulkReason(event.target.value)} rows={3} placeholder="Tuliskan alasan perubahan status..." className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring" /></div>
                            <p className="text-xs text-muted-foreground" role="status">{changedStudents.length} mahasiswa akan diperbarui. {selectedStudents.length - changedStudents.length} mahasiswa dengan status yang sama dilewati.</p>
                        </div>}
                        <DialogFooter>
                            <Button variant="outline" disabled={isBulkMutating} onClick={() => setBulkKind(null)}>Batal</Button>
                            <Button variant={bulkKind === "delete" ? "destructive" : "default"} disabled={isBulkMutating || !selectedStudents.length || (bulkKind === "status" && (!bulkReason.trim() || !changedStudents.length))} onClick={handleBulk}>
                                {isBulkMutating && <Loader2 className="animate-spin" />}{isBulkMutating ? "Memproses..." : bulkKind === "delete" ? `Ya, hapus ${selectedStudents.length} mahasiswa` : "Simpan status"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <Dialog open={studentToDelete !== null} onOpenChange={(open) => { if (!open && !isDeleting) setStudentToDelete(null) }}>
                    <DialogContent showCloseButton={!isDeleting} aria-busy={isDeleting}>
                        <DialogHeader>
                            <DialogTitle>Hapus mahasiswa?</DialogTitle>
                            <DialogDescription>Anda akan menghapus {studentToDelete?.name} (NIM {studentToDelete?.mahasiswa.nim}). Akun dan data akademik terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" disabled={isDeleting} onClick={() => setStudentToDelete(null)}>Batal</Button>
                            <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
                                {isDeleting ? <Loader2 className="animate-spin" /> : <TrashIcon />}
                                {isDeleting ? "Menghapus..." : "Ya, hapus mahasiswa"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }