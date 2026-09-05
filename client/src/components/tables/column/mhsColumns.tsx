import { type ColumnDef, type HeaderContext } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { Mahasiswa } from "@/types/campus";
import { Button } from "../../ui/button";
import { ArrowUpDown } from "lucide-react";
import { Link } from "react-router"


// helper reusable, biar tiap header sortable nggak copy-paste JSX yang sama
function createSortableHeader(label: string) {
  return function SortableHeader<TData>({ column }: HeaderContext<TData, unknown>) {
    const isSorted = column.getIsSorted(); // false | "asc" | "desc"
    return (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(isSorted === "asc")}
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    );
  };
}

export const mhsColumns: ColumnDef<Mahasiswa>[] = [
  createSelectColumn(),
  {
    id: "nim",                          
    accessorKey: "mahasiswa.nim",       
    header: createSortableHeader("NIM"),
    meta: { label: "NIM" },
  },
 {
    accessorKey: "name",
    header: "Nama",
    cell: ({ row }) => {
    const student = row.original

    console.log("STUDENT:", student)
    console.log("ID:", student.id)

    return (
        <Link
            to={`/mahasiswa/${student.id}`}
            className="font-medium hover:underline"
        >
            {student.name}
        </Link>
    )
},
},
  {
    accessorKey: "mahasiswa.prodi.name",
    header: "Prodi",
    meta: {
      label: "Prodi",
    },
  },
  {
    id: "semester",
    accessorKey: "mahasiswa.semester",
    header: createSortableHeader("Semester"),
    meta: { label: "Semester", align: "center" }
  },

  {
    accessorKey: "mahasiswa.status",
    header: "Status",
    meta: {
      label: "Status",
    },
  },
  createActionColumn<Mahasiswa>(undefined, undefined, undefined, (student) => `/mahasiswa/${student.id}`),
];