import { MasterDeleteDialog } from "@/components/master-data/MasterDeleteDialog"
import { ProdiEditDialog } from "./ProdiEditDialog"
import type { ProgramStudi } from "@/types/campus"
import { createActionColumn } from "@/components/tables/action-column"
import { toast } from "sonner"

import { DataTable } from "@/components/tables/data-table"
import { prodiColumns } from "@/components/tables/column/prodiColumns"
import { getAllProdi } from "@/features/action/campusThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/campusSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"



export default function PStudiPage() {
    const tableLoading = useAppSelector((state) => state.campus.isLoading)
    const dispatch = useAppDispatch()
    const {
        prodi,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.campus)
    const [editing, setEditing] = useState<ProgramStudi | null>(null)
    const [deleting, setDeleting] = useState<ProgramStudi | null>(null)
    const columns = useMemo(() => [
        ...prodiColumns.filter((column) => column.id !== "actions"),
        createActionColumn<ProgramStudi>((row) => setEditing(row), (row) => setDeleting(row)),
    ], [])
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
        dispatch(getAllProdi({ page, limit: 10, search, sortBy, sortOrder }));
    }, [dispatch, page, search, sortBy, sortOrder]);


    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Program Studi
                </div>
                <DataTable
                    isLoading={tableLoading}
                    columns={columns}
                    data={prodi}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    pageIndex={page - 1}
                    pageCount={totalPages}
                    onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
                    sorting={sorting}
                    onSortingChange={handleSortingChange}
                />
            </div>
            {editing && <ProdiEditDialog
                row={editing}
                onClose={() => setEditing(null)}
                onSave={() => {
                    setEditing(null)
                    toast.success("Program Studi berhasil diperbarui")
                    void dispatch(getAllProdi({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data tersimpan, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
                }}
            />}
            {deleting?.id != null && <MasterDeleteDialog module="prodi" id={deleting.id} onClose={() => setDeleting(null)} onDeleted={() => {
                setDeleting(null)
                toast.success("Program Studi berhasil dihapus")
                if (prodi.length === 1 && page > 1) dispatch(setPage(page - 1))
                else void dispatch(getAllProdi({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data terhapus, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
            }} />}
        </>
    )
}