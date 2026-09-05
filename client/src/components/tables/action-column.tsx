"use client"
import { type ColumnDef } from "@tanstack/react-table";
import { ActionCell } from "./action-cell";

export function createActionColumn<T>(
  onEdit?: (row: T) => void,
  onDelete?: (row: T) => void,
  onDetail?: (row: T) => void,
  detailPath?: (row: T) => string
): ColumnDef<T> {

  return {
    id: "actions",

    cell: ({ row }) => (
      <ActionCell
        row={row.original}
        onEdit={onEdit}
        onDelete={onDelete}
        onDetail={onDetail}
        detailPath={detailPath}
      />
    ),

  };

}