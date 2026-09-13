import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "../action-column";
import type { ProgramStudi } from "@/types/campus";

export const prodiColumns: ColumnDef<ProgramStudi>[] = [
  {
    accessorKey: "kode",
    header: "KODE",
  },
  {
    accessorKey: "name",
    header: "Nama Prodi",
  },
  {
    accessorKey: "fakultas",
    header: "Fakultas",
  },
  {
    accessorKey: "kaprodi",
    header: "Kaprodi",
  },
  createActionColumn(),


];