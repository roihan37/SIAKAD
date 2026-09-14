import { type Column, type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { Jadwal } from "@/types/campus";
import { Button } from "../../ui/button";
import { ArrowUpDown } from "lucide-react";

function createSortableHeader(label: string) {
  return function SortableHeader({ column }: { column: Column<Jadwal> }) {
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
    meta: { label: "Hari" },
  },
  {
    id: 'jam',
    accessorKey: "jam",
    header: createSortableHeader("Jam"),
    meta: {
      label: "Jam",
    },
  },
  {
    accessorKey: "mataKuliah",
    header: "Mata Kuliah",
    meta: { label: "Mata Kuliah" },
  },
  {
    accessorKey: "kelas",
    header: "Kelas",
    meta: { label: "Kelas" },
  },
  {
    accessorKey: "dosen",
    header: "Dosen",
    meta: { label: "Dosen" },
  },
  {
    accessorKey: "ruangan",
    header: "Ruangan",
    meta: { label: "Ruangan" },
  },
  { ...createActionColumn<Jadwal>(), meta: { label: "Aksi" } },

];