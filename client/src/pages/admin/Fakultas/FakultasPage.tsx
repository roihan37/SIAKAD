import { FakultasDeleteDialog } from "./FakultasDeleteDialog"
import { FakultasEditDialog } from "./FakultasEditDialog"
import type { Fakultas } from "@/types/campus"
import { createActionColumn } from "@/components/tables/action-column"
import { DataTable } from "@/components/tables/data-table"
import { fkColumns } from "@/components/tables/column/fkColumns"
import { getAllFakultas } from "@/features/action/campusThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/campusSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"

export default function FakultasPage() {
    const tableLoading = useAppSelector((state) => state.campus.isLoading)
    const dispatch = useAppDispatch()
    const [editing, setEditing] = useState<Fakultas | null>(null)
    const [deleting, setDeleting] = useState<Fakultas | null>(null)
    const columns = useMemo(() => [
        ...fkColumns.filter((column) => column.id !== "actions"),
        createActionColumn<Fakultas>((row) => setEditing(row), (row) => setDeleting(row)),
    ], [])
    const {
        fakultas,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.campus)
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
        dispatch(getAllFakultas({ page, limit: 10, search, sortBy, sortOrder }));
    }, [dispatch, page, search, sortBy, sortOrder]);

    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Fakultas
                </div>
                <DataTable
                    isLoading={tableLoading}
                    columns={columns}
                    data={fakultas}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    pageIndex={page - 1}
                    pageCount={totalPages}
                    onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
                    sorting={sorting}
                    onSortingChange={handleSortingChange}
                />
            </div>
            {editing && <FakultasEditDialog
                faculty={editing}
                onClose={() => setEditing(null)}
                onSaved={() => {
                    setEditing(null)
                    void dispatch(getAllFakultas({ page, limit: 10, search, sortBy, sortOrder }))
                }}
            />}
            {deleting && <FakultasDeleteDialog
                faculty={deleting}
                onClose={() => setDeleting(null)}
                onDeleted={() => {
                    setDeleting(null)
                    if (fakultas.length === 1 && page > 1) {
                        dispatch(setPage(page - 1))
                    } else {
                        void dispatch(getAllFakultas({ page, limit: 10, search, sortBy, sortOrder }))
                    }
                }}
            />}
        </>
    )
}