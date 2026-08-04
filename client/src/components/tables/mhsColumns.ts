import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Mahasiswa } from "@/types/campus";

export const mhsColumns: ColumnDef<Mahasiswa>[] = [

    {
        accessorKey: "mahasiswa.nim",
        header: "NIM",
    },
    {
        accessorKey: "name",
        header: "Nama",
    },
    {
        accessorKey: "mahasiswa.prodi.name",
        header: "Prodi",
    },
    {
        accessorKey: "mahasiswa.semester",
        header: "Semester",
    },
    {
        accessorKey: "mahasiswa.status",
        header: "Status",
    },
    createActionColumn(),
    createSelectColumn(),

];