import {  columnMhs} from "@/components/tables/columns"
import { mahasiswa } from "@/components/tables/data"
import { DataTable } from "@/components/tables/data-table"



export default function MahasiswaPage() {

    return (
        <>
            <div className="container mx-auto mt-4">
                <div className="text-2xl">
                    Data Mahasiswa
                </div>
                <DataTable columns={columnMhs} data={mahasiswa} />
            </div>
        </>
    )
}