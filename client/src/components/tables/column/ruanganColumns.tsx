import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { Ruangan } from "@/types/campus";

export const ruanganColumns: ColumnDef<Ruangan>[] = [
  createSelectColumn(),
  {
    accessorKey: "kode",
    header: "KODE",
  },
  {
    accessorKey: "nama",
    header: "Nama Ruangan",
  },
  {
    accessorKey: "gedung",
    header: "Gedung",
  },
  {
    accessorKey: "kapasitas",
    header: "Kapasitas",
  },
  createActionColumn(),
];