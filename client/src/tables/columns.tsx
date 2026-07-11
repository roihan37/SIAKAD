"use client"
import { type ColumnDef } from "@tanstack/react-table"

import { MoreHorizontal, PencilIcon, ShareIcon, TrashIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"

export type Payment = {
  id: string
  nim: string
  name: string
  status: "active" | "inactive" | "success" | "failed"
  semester: string,
  prodi: string
}

export const payments: Payment[] = [
  {
    id: "728ed52f",
    nim: "2403912082",
    name: "cahyadi",
    semester: "Semester 5",
    status: "active",
    prodi: "prodi"
  },

]

export const columns: ColumnDef<Payment>[] = [
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
    accessorKey: "status",
    header: "Status",
  },
  {
    id: "actions",
    cell: () => {

      return (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline"><MoreHorizontal className="h-4 w-4" /></Button>} />
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



