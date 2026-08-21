import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import { Button } from "../../ui/button";
import { ArrowUpDown } from "lucide-react";
import type { MataKuliah } from "@/types/campus";

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

export const matkulColumns: ColumnDef<MataKuliah>[] = [
  createSelectColumn(),
  {
    id : 'kode',
    accessorKey: "kode",
    header: createSortableHeader("KODE"),
  },
  {
    accessorKey: "nama",
    header: "Nama Mata kuliah",
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
    createActionColumn(),

];