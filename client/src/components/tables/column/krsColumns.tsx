import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { KRS } from "@/types/campus";
import { Button } from "../../ui/button";
import { ArrowUpDown } from "lucide-react";

function createSortableHeader(label: string) {
  return function SortableHeader({ column }: { column: any }) {
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

export const krsColumns: ColumnDef<KRS>[] = [
  createSelectColumn(),

  {
    id: 'nim',
    accessorKey: "nim",
    header: createSortableHeader("NIM"),
    meta: {
      label: "NIM",
    },
  },
  {
    id: 'nama',
    accessorKey: "nama",
    header: "Nama Mahasiswa"
  },
  {
    id: 'prodi',
    accessorKey: "prodi",
    header: "Program Studi",
  },
  {
    id: 'sks',
    accessorKey: "totalSks",
    header: "SKS",
  },
  {
    id: 'status',
    accessorKey: "status",
    header: "Status",

  },
  createActionColumn(),

];