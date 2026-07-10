import { columns, payments, } from "./columns"
import { DataTable } from "./data-table"



export default function DemoPage() {
  const data = payments

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns} data={data} />
    </div>
  )
}