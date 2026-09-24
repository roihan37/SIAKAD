import { MasterDeleteDialog } from "@/components/master-data/MasterDeleteDialog"
import { MatkulEditDialog } from "./MatkulEditDialog"
import type { MataKuliah } from "@/types/campus"
import { createActionColumn } from "@/components/tables/action-column"
import { toast } from "sonner"

import { DataTable } from "@/components/tables/data-table"
import { matkulColumns } from "@/components/tables/column/matkulColumns"
import { getAllMatkul } from "@/features/action/matkulThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/matkulSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"


export default function MatkulPage() {
    const tableLoading = useAppSelector((state) => state.matkul.isLoading)
    const dispatch = useAppDispatch()
    const {
        matkul,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.matkul)
    const [editing, setEditing] = useState<MataKuliah | null>(null)
    const [deleting, setDeleting] = useState<MataKuliah | null>(null)
    const columns = useMemo(() => [
        ...matkulColumns.filter((column) => column.id !== "actions"),
        createActionColumn<MataKuliah>((row) => setEditing(row), (row) => setDeleting(row)),
    ], [])
    const [searchInput, setSearchInput] = useState(search)
    const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []

    const handleSortingChange = (next: SortingState) => {
        if (next.length === 0) {
            dispatch(setSorting({ sortBy: "name", sortOrder: "desc" }))
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
        dispatch(getAllMatkul({ page, limit: 10, search, sortBy, sortOrder }));
    }, [dispatch, page, search, sortBy, sortOrder]);


    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Mata Kuliah
                </div>
                <DataTable
                    isLoading={tableLoading}
                    columns={columns}
                    data={matkul}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    pageIndex={page - 1}
                    pageCount={totalPages}
                    onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
                    sorting={sorting}
                    onSortingChange={handleSortingChange}
                />
            </div>
            {editing && <MatkulEditDialog
                row={editing}
                onClose={() => setEditing(null)}
                onSave={() => {
                    setEditing(null)
                    toast.success("Mata Kuliah berhasil diperbarui")
                    void dispatch(getAllMatkul({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data tersimpan, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
                }}
            />}
            {deleting?.id != null && <MasterDeleteDialog module="mata-kuliah" id={deleting.id} onClose={() => setDeleting(null)} onDeleted={() => {
                setDeleting(null)
                toast.success("Mata Kuliah berhasil dihapus")
                if (matkul.length === 1 && page > 1) dispatch(setPage(page - 1))
                else void dispatch(getAllMatkul({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data terhapus, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
            }} />}
        </>
    )
}