import { DataTable } from "@/components/tables/data-table"
import { fkColumns } from "@/components/tables/fkColumns"
import { getAllFakultas } from "@/features/action/campusThunk"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useEffect } from "react"

export default function FakultasPage() {
    const dispatch = useAppDispatch()
    const {fakultas} = useAppSelector((state)=> state.campus)
    useEffect(()=>{
        dispatch(getAllFakultas())
    },[dispatch])
    
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Fakultas
                </div>
                <DataTable columns={fkColumns} data={fakultas} />
            </div>
        </>
    )
}