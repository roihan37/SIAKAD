import { MasterDeleteDialog } from "@/components/master-data/MasterDeleteDialog"
import { RuanganEditDialog } from "./RuanganEditDialog"
import type { Ruangan } from "@/types/campus"
import { createActionColumn } from "@/components/tables/action-column"
import { toast } from "sonner"
import { ruanganColumns } from "@/components/tables/column/ruanganColumns"
import { DataTable } from "@/components/tables/data-table"
import { getAllRuangan } from "@/features/action/ruanganThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/ruanganSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"

export default function RuanganPage() {
     const tableLoading = useAppSelector((state) => state.ruangan.isLoading)
  const dispatch = useAppDispatch()
   const {
        ruangan,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.ruangan)
    const [editing, setEditing] = useState<Ruangan | null>(null)
    const [deleting, setDeleting] = useState<Ruangan | null>(null)
    const columns = useMemo(() => [
        ...ruanganColumns.filter((column) => column.id !== "actions"),
        createActionColumn<Ruangan>((row) => setEditing(row), (row) => setDeleting(row)),
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
            dispatch(getAllRuangan({ page, limit: 10, search, sortBy, sortOrder }));
        }, [dispatch, page, search, sortBy, sortOrder]);
    
    

    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Ruangan
                </div>
                <DataTable
                    isLoading={tableLoading}
                    columns={columns}
                    data={ruangan}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    pageIndex={page - 1}
                    pageCount={totalPages}
                    onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
                    sorting={sorting}
                    onSortingChange={handleSortingChange}
                />
            </div>
            {editing && <RuanganEditDialog
                row={editing}
                onClose={() => setEditing(null)}
                onSave={() => {
                    setEditing(null)
                    toast.success("Ruangan berhasil diperbarui")
                    void dispatch(getAllRuangan({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data tersimpan, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
                }}
            />}
            {deleting?.id != null && <MasterDeleteDialog module="ruangan" id={deleting.id} onClose={() => setDeleting(null)} onDeleted={() => {
                setDeleting(null)
                toast.success("Ruangan berhasil dihapus")
                if (ruangan.length === 1 && page > 1) dispatch(setPage(page - 1))
                else void dispatch(getAllRuangan({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data terhapus, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
            }} />}
        </>
    )
}