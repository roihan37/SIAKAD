import { BulkActionDialog, BulkActionsToolbar } from "@/components/tables/bulk-actions"
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
                        toolbar={<BulkActionsToolbar count={selectedStudents.length} entity="mahasiswa" busy={isBulkMutating} onAction={openBulk} onClear={clearSelection} />}
                        pageIndex={page - 1}
                        pageCount={totalPages}
                        onPageChange={(newIndex) => { clearSelection(); dispatch(setPage(newIndex + 1)) }}
                        sorting={sorting} 
                        onSortingChange={(next) => { clearSelection(); handleSortingChange(next) }}
                    />
                </div>
                <BulkActionDialog kind={bulkKind} entity="mahasiswa" targets={selectedStudents.map((student) => ({ id: student.id, name: student.name, identifier: student.mahasiswa.nim, status: student.mahasiswa.status }))} busy={isBulkMutating} status={bulkStatus} statusOptions={["Aktif", "Cuti", "Lulus", "Nonaktif"]} onStatusChange={(status) => setBulkStatus(status as typeof bulkStatus)} reason={bulkReason} onReasonChange={setBulkReason} deleteDescription={`Akun dan data akademik terkait dari ${selectedStudents.length} mahasiswa akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`} onClose={() => setBulkKind(null)} onConfirm={handleBulk} />
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