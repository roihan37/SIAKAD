import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { Jadwal } from "@/types/campus";
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

export const jadwalColumns: ColumnDef<Jadwal>[] = [
  createSelectColumn(),
  {
    accessorKey: "hari",
    header: "Hari",
  },
  {
    id: 'jam',
    accessorKey: "jam",
    header: createSortableHeader("Jam"),
    meta: {
      label: "Nama Fakultas",
    },
  },
  {
    accessorKey: "mataKuliah",
    header: "Mata Kuliah",
  },
  {
    accessorKey: "kelas",
    header: "Kelas",
  },
  {
    accessorKey: "dosen",
    header: "Dosen",
  },
  {
    accessorKey: "ruangan",
    header: "Ruangan",
  },
  createActionColumn(),

];