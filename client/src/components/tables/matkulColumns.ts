import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Matkul } from "@/types/campus";

export const matkulColumns: ColumnDef<Matkul>[] = [
  {
    accessorKey: "kode",
    header: "KODE",
  },
  {
    accessorKey: "name_mk",
    header: "Nama Matakuliah",
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
    createSelectColumn(),

];