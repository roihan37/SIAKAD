import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useState } from "react"

export default function RuanganPage() {
   const dispatch = useAppDispatch()
   const {
        prodi,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder, } = useAppSelector((state) => state.campus)
    const [searchInput, setSearchInput] = useState(search)
    const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []

    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Ruangan
                </div>
                {/* <DataTable
                    columns={prodiColumns}
                    // data={prodi}
                    // searchValue={searchInput}
                    // onSearchChange={setSearchInput}
                    // pageIndex={page - 1}
                    // pageCount={totalPages}
                    // onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
                    // sorting={sorting}
                    // onSortingChange={handleSortingChange}
                /> */}
            </div>
        </>
    )
}