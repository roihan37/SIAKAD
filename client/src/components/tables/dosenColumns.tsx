import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Dosen } from "@/types/campus";
import { Button } from "../ui/button";
import { ArrowUpDown } from "lucide-react";

// helper reusable, biar tiap header sortable nggak copy-paste JSX yang sama
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

export const dosenColumns: ColumnDef<Dosen>[] = [
  createSelectColumn(),
  {
    id: "nidn",
    accessorKey: "dosen.nidn",
    header: createSortableHeader("NIDN"),
    meta: {
      label: "NIDN",
    },
  },
  {
    accessorKey: "name",
    header: "Nama",
    meta: {
      label: "Name",
    },
  },
  {
    accessorKey: "dosen.prodi.name",
    header: "Prodi",
    meta: {
      label: "Prodi",
    },
  },
  {
    accessorKey: "dosen.jabatan",
    header: "Jabatan",
    meta: {
      label: "Jabatan",
    },
  },
  {
    accessorKey: "dosen.status",
    header: "Status",
    meta: {
      label: "Status",
    },
  },
  createActionColumn(),


];