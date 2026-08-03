import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Dosen } from "@/types/campus";

export const dosenColumns: ColumnDef<Dosen>[] = [

    {
        accessorKey: "nidn",
        header: "NIDN",
      },
      {
        accessorKey: "name",
        header: "Nama",
      },
      {
        accessorKey: "prodi",
        header: "Prodi",
      },
      {
        accessorKey: "jabatan",
        header: "Jabatan",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
    createActionColumn(),
    createSelectColumn(),

];