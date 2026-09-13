import { MasterDeleteDialog } from "@/components/master-data/MasterDeleteDialog"
import { KurikulumEditDialog } from "./KurikulumEditDialog"
import type { Kurikulum } from "@/types/campus"
import { createActionColumn } from "@/components/tables/action-column"
import { toast } from "sonner"
import { kurikulumColumns } from "@/components/tables/column/kurikulumColumns"
import { DataTable } from "@/components/tables/data-table"
import { getAllKurikulum } from "@/features/action/kurikulumThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/kurikulumSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"

export default function KurikulumPage() {
     const tableLoading = useAppSelector((state) => state.kurikulum.isLoading)
  const dispatch = useAppDispatch()
   const {
        kurikulum,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.kurikulum)
    const [editing, setEditing] = useState<Kurikulum | null>(null)
    const [deleting, setDeleting] = useState<Kurikulum | null>(null)
    const columns = useMemo(() => [
        ...kurikulumColumns.filter((column) => column.id !== "actions"),
        createActionColumn<Kurikulum>((row) => setEditing(row), (row) => setDeleting(row)),
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
            dispatch(getAllKurikulum({ page, limit: 10, search, sortBy, sortOrder }));
        }, [dispatch, page, search, sortBy, sortOrder]);
    
    

    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Kurikulum
                </div>
                <DataTable
                    isLoading={tableLoading}
                    columns={columns}
                    data={kurikulum}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    pageIndex={page - 1}
                    pageCount={totalPages}
                    onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
                    sorting={sorting}
                    onSortingChange={handleSortingChange}
                />
            </div>
            {editing && <KurikulumEditDialog
                row={editing}
                onClose={() => setEditing(null)}
                onSave={() => {
                    setEditing(null)
                    toast.success("Kurikulum berhasil diperbarui")
                    void dispatch(getAllKurikulum({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data tersimpan, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
                }}
            />}
            {deleting?.id != null && <MasterDeleteDialog module="kurikulum" id={deleting.id} onClose={() => setDeleting(null)} onDeleted={() => {
                setDeleting(null)
                toast.success("Kurikulum berhasil dihapus")
                if (kurikulum.length === 1 && page > 1) dispatch(setPage(page - 1))
                else void dispatch(getAllKurikulum({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data terhapus, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
            }} />}
        </>
    )
}