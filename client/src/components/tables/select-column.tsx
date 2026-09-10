// select-column.tsx

import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "../ui/checkbox";

export function createSelectColumn<T>(): ColumnDef<T> {

  return {

    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        indeterminate={table.getIsSomePageRowsSelected()}
        disabled={!table.getRowModel().rows.some((row) => row.getCanSelect())}
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Pilih semua di halaman ini"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
      />
    ),
    enableSorting: false,
    enableHiding: false,

  };

}