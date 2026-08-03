import {  fakultas } from "@/components/tables/data"
import { DataTable } from "@/components/tables/data-table"
import { fkColumns } from "@/components/tables/fkColumns"



export default function FakultasPage() {
    
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