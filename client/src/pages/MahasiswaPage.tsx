
import { DataTable } from "@/components/tables/data-table"
import { mhsColumns } from "@/components/tables/mhsColumns.tsx"
import { getAllStudents } from "@/features/action/usersThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/usersSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useState } from "react"



export default function MahasiswaPage() {
    const dispatch = useAppDispatch()
    const { students,
        page,
        totalPages,
        search,
        sortBy,
        sortOrder,
    } = useAppSelector((state) => state.users)


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
                        columns={mhsColumns}
                        data={students}
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