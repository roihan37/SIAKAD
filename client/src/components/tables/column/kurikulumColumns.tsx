import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { Kurikulum } from "@/types/campus";
import { Badge } from "@/components/ui/badge";

export const kurikulumColumns: ColumnDef<Kurikulum>[] = [
  createSelectColumn(),
  {
    accessorKey: "kode",
    header: "Kode",
  },
  {
    accessorKey: "namaKurikulum",
    header: "Nama Kurikulum",
  },
  {
    accessorKey: "namaProdi",
    header: "Nama Prodi",
  },
  {
    accessorKey: "tahun",
    header: "Tahun",
  },
  {
    accessorKey: "semester",
    header: "Semester",
  },
  {
    accessorKey: "totalSks",
    header: "Total SKS",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue<boolean>("isActive")

      return (
        <Badge
          variant={isActive ? "outline" : "destructive"}
          className={
            isActive
              ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
              : ""
          }
        >
          {isActive ? "Aktif" : "Tidak Aktif"}
        </Badge>
      )
    },
  },
  createActionColumn(),
];