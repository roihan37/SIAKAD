
import { DataTable } from "@/components/tables/data-table"
import { mhsColumns } from "@/components/tables/mhsColumns.tsx"
import { getAllStudents } from "@/features/action/usersThunk"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect } from "react"



export default function MahasiswaPage() {
    const dispatch = useAppDispatch()
    const {students,
        page,
        totalPages,
    } = useAppSelector((state)=>state.users)
    useEffect(() => {
        dispatch(getAllStudents({page,limit:10}));
    }, [dispatch, page]);
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Mahasiswa
                </div>
                <DataTable 
                columns={mhsColumns} 
                data={students} />
            </div>
        </>
    )
}