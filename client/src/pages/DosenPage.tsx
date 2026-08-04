import { DataTable } from "@/components/tables/data-table"
import { dosenColumns } from "@/components/tables/dosenColumns"
import { getAllLecturers } from "@/features/action/usersThunk"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect } from "react"



export default function DosenPage() {
    const dispatch = useAppDispatch()
    const {lecturers} = useAppSelector((state)=> state.users)
    useEffect(()=>{
        console.log("DosenPage mounted");

        dispatch(getAllLecturers())
        
    },[])
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Dosen
                </div>
                <DataTable columns={dosenColumns} data={lecturers} />
            </div>
        </>
    )
}