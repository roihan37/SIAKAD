import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { TahunAkademik } from "@/types/campus";
import { Badge } from "@/components/ui/badge";

export const tAkademikColumns: ColumnDef<TahunAkademik>[] = [
  createSelectColumn(),
  {
    accessorKey: "tahun",
    header: "Tahun",
  },
  {
    accessorKey: "semester",
    header: "Semester",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue<boolean>("status")

      return (
        <Badge
          variant={status ? "outline" : "destructive"}
          className={
            status
              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : ""
          }
        >
          {status ? "Aktif" : "Tidak Aktif"}
        </Badge>
      )
    },
  },
  createActionColumn(),
];