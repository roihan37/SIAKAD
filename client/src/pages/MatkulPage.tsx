
import { DataTable } from "@/components/tables/data-table"
import { matkulColumns } from "@/components/tables/matkulColumns"



export default function MatkulPage() {
    
    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Mata Kuliah
                </div>
                {/* <DataTable columns={matkulColumns} 
                data={matkul} 
                /> */}
            </div>
        </>
    )
}