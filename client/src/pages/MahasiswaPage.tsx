import {  columnMhs} from "@/components/tables/columns"
import { mahasiswa } from "@/components/tables/data"
import { DataTable } from "@/components/tables/data-table"
import { mahasiswaColumns } from "@/components/tables/mahasiswa.columns"
import { useEffect } from "react"



export default function MahasiswaPage() {
    
    useEffect(()=>{},[])
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Mahasiswa
                </div>
                <DataTable columns={mahasiswaColumns} data={mahasiswa} />
            </div>
        </>
    )
}