import {  columnFk } from "@/components/tables/columns"
import {  fakultas } from "@/components/tables/data"
import { DataTable } from "@/components/tables/data-table"



export default function FakultasPage() {
    
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Fakultas
                </div>
                <DataTable columns={columnFk} data={fakultas} />
            </div>
        </>
    )
}