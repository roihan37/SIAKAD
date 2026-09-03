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
  Columns3,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { DialogForm } from "../form-add-data/dialog-form"


interface DataTableProps<TData, TValue> {
  // Table
  columns: ColumnDef<TData, TValue>[]
  data: TData[]

  // Search
  searchValue: string
  onSearchChange: (value: string) => void

  // Pagination
  pageIndex: number
  pageCount: number
  onPageChange: (pageIndex: number) => void

  // Sorting
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void

  // Filter Program Studi
  
  selectedProdiId?: number
  onProdiChange?: (
    value: number | undefined
  ) => void

  // Filter Tahun Akademik
  // tahunAkademik?: ComboboxItemType[]
  selectedTahunAkademikId?: number
  onTahunAkademikChange?: (
    value: number | undefined
  ) => void

  // Loading
  isLoading?: boolean
  toolbar?: React.ReactNode
  toolbar2?: React.ReactNode

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

  toolbar,
  toolbar2,

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
      <div className="space-y-3 py-4">

        {/* Search + Action */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <Input
            placeholder="Cari mata kuliah, dosen, kelas..."
            value={searchValue}
            onChange={(e) =>
              onSearchChange(e.target.value)
            }
            className="w-full lg:max-w-md"
          />

          <div className="flex w-full gap-2 sm:w-auto">

            <div className="flex-1 sm:flex-none">
              <DialogForm />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    className="flex-1 sm:flex-none"
                  >
                    <Columns3 className="size-4" />

                    <span className="hidden sm:inline">
                      Columns
                    </span>
                  </Button>
                }
              />

              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      column.getCanHide()
                  )
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={
                        column.getIsVisible()
                      }
                      onCheckedChange={(value) =>
                        column.toggleVisibility(
                          !!value
                        )
                      }
                    >
                      {(column.columnDef.meta as any)
                        ?.label ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>

        {/* Custom Toolbar */}
        {toolbar2}
        {toolbar}

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
      <div className="flex flex-col gap-3 border-t py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} dari{" "}
          {table.getFilteredRowModel().rows.length} data dipilih
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Halaman {pageIndex + 1} dari {pageCount || 1}
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={pageIndex <= 0}
            >
              Sebelumnya
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={pageIndex + 1 >= pageCount}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}