
import { DataTable } from "@/components/tables/data-table"
import { prodiColumns } from "@/components/tables/prodiColumns"
import { getAllProdi } from "@/features/action/campusThunk"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect } from "react"



export default function PStudiPage() {
    const dispatch = useAppDispatch()
    const {prodi} = useAppSelector((state)=> state.campus)
    useEffect(()=>{
        dispatch(getAllProdi())
    },[dispatch])

    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Program Studi
                </div>
                <DataTable columns={prodiColumns} data={prodi} />
            </div>
        </>
    )
}