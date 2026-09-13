import { Badge } from "@/components/ui/badge";
import { type Column, type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { KRS } from "@/types/campus";
import { Button } from "../../ui/button";
import { ArrowUpDown } from "lucide-react";

function createSortableHeader(label: string) {
  return function SortableHeader({ column }: { column: Column<KRS> }) {
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
    cell: ({ row }) => {
      const status = row.original.status
      const labels: Record<string, string> = { DRAFT: "Draft", DIAJUKAN: "Diajukan", MENUNGGU: "Diajukan", DISETUJUI: "Disetujui", DITOLAK: "Ditolak", BELUM_KRS: "Belum KRS" }
      const colors: Record<string, string> = {
        DISETUJUI: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        DIAJUKAN: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
        DITOLAK: "bg-red-500/10 text-red-700 dark:text-red-400",
        DRAFT: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      }
      return <Badge variant="secondary" className={colors[status]}>{labels[status] ?? "Status tidak dikenal"}</Badge>
    },

  },
  createActionColumn(),

];