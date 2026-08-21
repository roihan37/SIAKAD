import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import { createSelectColumn } from "../select-column";
import type { ProgramStudi } from "@/types/campus";

export const prodiColumns: ColumnDef<ProgramStudi>[] = [
  createSelectColumn(),
  {
    accessorKey: "kode",
    header: "KODE",
  },
  {
    accessorKey: "name",
    header: "Nama Ruangan",
  },
  {
    accessorKey: "gedung",
    header: "Gedung",
  },
  {
    accessorKey: "capacity",
    header: "Kapasitas",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "aksi",
    header: "Aksi",
  },
  createActionColumn(),


];