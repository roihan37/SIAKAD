import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Dosen } from "@/types/campus";

export const dosenColumns: ColumnDef<Dosen>[] = [

    {
        accessorKey: "dosen.nidn",
        header: "NIDN",
      },
      {
        accessorKey: "name",
        header: "Nama",
      },
      {
        accessorKey: "dosen.prodi.name",
        header: "Prodi",
      },
      {
        accessorKey: "dosen.jabatan",
        header: "Jabatan",
      },
      {
        accessorKey: "dosen.status",
        header: "Status",
      },
    createActionColumn(),
    createSelectColumn(),

];