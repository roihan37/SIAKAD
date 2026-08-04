import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Fakultas } from "@/types/campus";

export const fkColumns: ColumnDef<Fakultas>[] = [

    {
        accessorKey: "kode",
        header: "KODE",
      },
      {
        accessorKey: "name",
        header: "Nama Fakultas",
      },
      {
        accessorKey: "dekan",
        header: "Dekan",
      },
    createActionColumn(),
    createSelectColumn(),

];