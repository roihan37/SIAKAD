import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Fakultas } from "@/types/campus";
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

export const fkColumns: ColumnDef<Fakultas>[] = [
  createSelectColumn(),

  {
    id: 'kode',
    accessorKey: "kode",
    header: createSortableHeader("KODE"),
    meta: {
      label: "KODE",
    },
  },
  {
    id: 'name',
    accessorKey: "name",
    header: createSortableHeader("Nama Fakultas"),
    meta: {
      label: "Nama Fakultas",
    },
  },
  {
    accessorKey: "dekan",
    header: "Dekan",
  },
  createActionColumn(),

];