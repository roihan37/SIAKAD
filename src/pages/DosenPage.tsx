import { columnDosen } from "@/components/tables/columns"
import { dosen } from "@/components/tables/data"
import { DataTable } from "@/components/tables/data-table"



export default function DosenPage() {
    
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Dosen
                </div>
                <DataTable columns={columnDosen} data={dosen} />
            </div>
        </>
    )
}