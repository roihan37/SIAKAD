import { columns, payments, } from "@/payments/columns"
import { DataTable } from "@/payments/data-table"



export default function MahasiswaPage() {
  const data = payments

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}