
import { DataTable } from "@/components/tables/data-table"
import { matkulColumns } from "@/components/tables/column/matkulColumns"
import { getAllMatkul } from "@/features/action/matkulThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/matkulSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useState } from "react"


export default function MatkulPage() {
    const dispatch = useAppDispatch()
    const {
        matkul,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.matkul)
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
                    columns={matkulColumns}
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
        </>
    )
}