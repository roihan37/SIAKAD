import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Matkul } from "@/types/campus";
import { Button } from "../ui/button";
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

export const matkulColumns: ColumnDef<Matkul>[] = [
  createActionColumn(),
  {
    id : 'kode',
    accessorKey: "kode",
    header: createSortableHeader("KODE"),
  },
  {
    accessorKey: "name_mk",
    header: "Nama Matakuliah",
  },
  {
    accessorKey: "sks",
    header: "SKS",
  },
  {
    accessorKey: "semester",
    header: "Semester",
  },
  {
    accessorKey: "prodi",
    header: "Prodi",
  },
    createSelectColumn(),

];