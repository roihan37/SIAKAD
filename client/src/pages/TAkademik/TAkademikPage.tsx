import { MasterDeleteDialog } from "@/components/master-data/MasterDeleteDialog"
import { TAkademikEditDialog } from "./TAkademikEditDialog"
import type { TahunAkademik } from "@/types/campus"
import { createActionColumn } from "@/components/tables/action-column"
import { toast } from "sonner"
import { tAkademikColumns } from "@/components/tables/column/tAkademikColumns"
import { DataTable } from "@/components/tables/data-table"
import { getAllTAkademik } from "@/features/action/tAkademikThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/tAkademikSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"

export default function TAkademik() {
     const tableLoading = useAppSelector((state) => state.tAkademik.isLoading)
  const dispatch = useAppDispatch()
   const {
        tAkademik,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.tAkademik)
    const [editing, setEditing] = useState<TahunAkademik | null>(null)
    const [deleting, setDeleting] = useState<TahunAkademik | null>(null)
    const columns = useMemo(() => [
        ...tAkademikColumns.filter((column) => column.id !== "actions"),
        createActionColumn<TahunAkademik>((row) => setEditing(row), (row) => setDeleting(row)),
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
            dispatch(getAllTAkademik({ page, limit: 10, search, sortBy, sortOrder }));
        }, [dispatch, page, search, sortBy, sortOrder]);
    
    

    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Tahun Akademik
                </div>
                <DataTable
                    isLoading={tableLoading}
                    columns={columns}
                    data={tAkademik}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    pageIndex={page - 1}
                    pageCount={totalPages}
                    onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
                    sorting={sorting}
                    onSortingChange={handleSortingChange}
                />
            </div>
            {editing && <TAkademikEditDialog
                row={editing}
                onClose={() => setEditing(null)}
                onSave={() => {
                    setEditing(null)
                    toast.success("Tahun Akademik berhasil diperbarui")
                    void dispatch(getAllTAkademik({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data tersimpan, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
                }}
            />}
            {deleting?.id != null && <MasterDeleteDialog module="tahun-akademik" id={deleting.id} onClose={() => setDeleting(null)} onDeleted={() => {
                setDeleting(null)
                toast.success("Tahun Akademik berhasil dihapus")
                if (tAkademik.length === 1 && page > 1) dispatch(setPage(page - 1))
                else void dispatch(getAllTAkademik({ page, limit: 10, search, sortBy, sortOrder })).unwrap().catch(() => toast.error("Data terhapus, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman."))
            }} />}
        </>
    )
}