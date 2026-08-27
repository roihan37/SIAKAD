import { DataTable } from "@/components/tables/data-table"
import { fkColumns } from "@/components/tables/column/fkColumns"
import { getAllFakultas } from "@/features/action/campusThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/jadwalSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { getAllJadwal } from "@/features/action/jadwalThunk"
import { jadwalColumns } from "@/components/tables/column/jadwalColumns"

export default function JadwalPage() {
    const dispatch = useAppDispatch()
    const {
        jadwal,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.jadwal)
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
        dispatch(getAllJadwal({ page, limit: 10, search, sortBy, sortOrder }));
    }, [dispatch, page, search, sortBy, sortOrder]);

    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Fakultas
                </div>
                <DataTable
                    columns={jadwalColumns}
                    data={jadwal}
                    searchValue={searchInput}
                    onSearchChange={setSearchInput}
                    pageIndex={page - 1}
                    pageCount={totalPages}
                    onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
                    sorting={sorting}
                    onSortingChange={handleSortingChange}
                />
            </div>
        </>
    )
}