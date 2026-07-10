import { columnMatkul } from "@/components/tables/columns"
import {  matkul } from "@/components/tables/data"
import { DataTable } from "@/components/tables/data-table"



export default function MatkulPage() {
    
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Mata Kuliah
                </div>
                <DataTable columns={columnMatkul} data={matkul} />
            </div>
        </>
    )
}