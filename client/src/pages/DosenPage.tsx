import { dosen } from "@/components/tables/data"
import { DataTable } from "@/components/tables/data-table"
import { dosenColumns } from "@/components/tables/dosenColumns"



export default function DosenPage() {
    
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Dosen
                </div>
                <DataTable columns={dosenColumns} data={dosen} />
            </div>
        </>
    )
}