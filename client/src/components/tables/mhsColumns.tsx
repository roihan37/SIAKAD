import { type ColumnDef } from "@tanstack/react-table";
import { createActionColumn } from "./action-column";
import { createSelectColumn } from "./select-column";
import type { Mahasiswa } from "@/types/campus";
import { Button } from "../ui/button";
import { ArrowUpDown } from "lucide-react";

export const mhsColumns: ColumnDef<Mahasiswa>[] = [
    createSelectColumn(),
    {
        accessorKey: "mahasiswa.nim",
        header: ({ column }) => {
            return (
              <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              >
                NIM
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            )
          },
          meta: {
            label: "NIM",
          },
    },
    {
        accessorKey: "name",
        header: "Nama",
        meta: {
          label: "Nama",
        },
    },
    {
        accessorKey: "mahasiswa.prodi.name",
        header: "Prodi",
        meta: {
          label: "Prodi",
        },
    },
    {
        accessorKey: "mahasiswa.semester",
        header: "Semester",
        meta: {
          label: "Semester",
        },
    },
    {
        accessorKey: "mahasiswa.status",
        header: "Status",
        meta: {
          label: "Status",
        },
    },
    createActionColumn(),
    

];