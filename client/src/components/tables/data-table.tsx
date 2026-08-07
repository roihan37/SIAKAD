"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import React from "react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DialogForm } from "../dialog-form"


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchValue: string
  onSearchChange: (value: string) => void
  pageIndex: number       // 0-based
  pageCount: number
  onPageChange: (pageIndex: number) => void
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
  isLoading?: boolean
}


export function DataTable<TData, TValue>({
  columns,
  data,
  searchValue,
  onSearchChange,
  pageIndex,
  pageCount,
  onPageChange,
  sorting,
  onSortingChange,
  // isLoading,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater
      onSortingChange(next)
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex, pageSize: 10 },
    },
  })
  return (
    <div>
      <div className="flex items-center py-4 justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filter Nama, NIM, NIDN, Kode..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm w-xl"
          />
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" className="ml-auto">
                Columns
              </Button>} >
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(
                    (column) => column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {(column.columnDef.meta as any)?.label ?? column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <div className="">
          {/* FORM */}
          <DialogForm />
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}
                      className={(header.column.columnDef.meta as any)?.align === "center" ? "text-center" : ""}
                    >

                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}
                      className={(cell.column.columnDef.meta as any)?.align === "center" ? "text-center" : ""}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            // onClick={() => table.previousPage()}
            // disabled={!table.getCanPreviousPage()}
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex <= 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            // onClick={() => table.nextPage()}
            // disabled={!table.getCanNextPage()}
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex + 1 >= pageCount}
          >
            Next
          </Button>
        </div>
        <div className="flex text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
          Halaman {pageIndex + 1} dari {pageCount || 1}
        </div>
      </div>
    </div>
  )
}