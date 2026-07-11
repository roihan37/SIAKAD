"use client"
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, PencilIcon, ShareIcon, TrashIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Dosen, Mahasiswa } from "@/types/user"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Fakultas } from "@/types/campus"
import type { Matkul, ProgramStudi } from "./data"

export const columnMhs: ColumnDef<Mahasiswa>[] = [
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
  {
    id: "actions",
    cell: () => {

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<MoreHorizontal className="h-4 w-4" />} />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon />
                Share
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

export const columnDosen: ColumnDef<Dosen>[] = [
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
  {
    id: "actions",
    cell: () => {

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<MoreHorizontal className="h-4 w-4" />} />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon />
                Share
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

export const columnFk: ColumnDef<Fakultas>[] = [
  {
    accessorKey: "kode",
    header: "KODE",
  },
  {
    accessorKey: "name_fk",
    header: "Nama Fakultas",
  },
  {
    accessorKey: "dekan",
    header: "Dekan",
  },
  {
    id: "actions",
    cell: () => {

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<MoreHorizontal className="h-4 w-4" />} />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon />
                Share
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

export const columnPStudi: ColumnDef<ProgramStudi>[] = [
  {
    accessorKey: "kode",
    header: "KODE",
  },
  {
    accessorKey: "name_ps",
    header: "Nama Prodi",
  },
  {
    accessorKey: "fakultas",
    header: "Fakultas",
  },
  {
    accessorKey: "kaProdi",
    header: "Kaprodi",
  },
  {
    id: "actions",
    cell: () => {

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<MoreHorizontal className="h-4 w-4" />} />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon />
                Share
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]

export const columnMatkul: ColumnDef<Matkul>[] = [
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
  {
    id: "actions",
    cell: () => {

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<MoreHorizontal className="h-4 w-4" />} />
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <PencilIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ShareIcon />
                Share
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem variant="destructive">
                <TrashIcon />
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
]




