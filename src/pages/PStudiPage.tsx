import { columnPStudi } from "@/components/tables/columns"
import { programStudi } from "@/components/tables/data"
import { DataTable } from "@/components/tables/data-table"



export default function PStudiPage() {
    
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Program Studi
                </div>
                <DataTable columns={columnPStudi} data={programStudi} />
            </div>
        </>
    )
}