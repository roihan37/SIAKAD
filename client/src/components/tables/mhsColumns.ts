import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Mahasiswa } from "@/types/campus";

export const mhsColumns: ColumnDef<Mahasiswa>[] = [

    {
        accessorKey: "nim",
        header: "NIM",
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
        accessorKey: "semester",
        header: "Semester",
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    createActionColumn(),
    createSelectColumn(),

];