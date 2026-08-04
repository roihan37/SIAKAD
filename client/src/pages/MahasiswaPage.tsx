
import { DataTable } from "@/components/tables/data-table"
import { mhsColumns } from "@/components/tables/mhsColumns"
import { getAllStudents } from "@/features/action/usersThunk"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect } from "react"



export default function MahasiswaPage() {
    const dispatch = useAppDispatch()
    const {students} = useAppSelector((state)=>state.users)
    useEffect(() => {
        dispatch(getAllStudents());
    }, [dispatch]);
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Mahasiswa
                </div>
                <DataTable columns={mhsColumns} data={students} />
            </div>
        </>
    )
}