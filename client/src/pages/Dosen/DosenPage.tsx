import { useEffect, useRef, useState } from "react"
import type { RowSelectionState, SortingState } from "@tanstack/react-table"
import { DataTable } from "@/components/tables/data-table"
import { dosenColumns } from "@/components/tables/column/dosenColumns"
import { BulkActionDialog, BulkActionsToolbar, type BulkKind } from "@/components/tables/bulk-actions"
import { Button } from "@/components/ui/button"
import { bulkMutateLecturers, getAllLecturers, type BulkLecturerAction } from "@/features/action/dosenThunk"
import { setPage, setSearch, setSorting } from "@/features/slice/dosenSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"

const statusOptions = ["Aktif", "Cuti", "Lulus", "Nonaktif"] as const

export default function DosenPage() {
  const dispatch = useAppDispatch()
  const { page, limit, totalPages, totalRows, search, sortBy, sortOrder, lecturers, isBulkMutating, isLoadingLecturers, lecturerListError } = useAppSelector((state) => state.lecturers)
  const [searchInput, setSearchInput] = useState(search)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [kind, setKind] = useState<BulkKind | null>(null)
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("Aktif")
  const [processing, setProcessing] = useState(false)
  const requestLock = useRef(false)
  const busy = processing || isBulkMutating
  const selected = lecturers.filter((lecturer) => rowSelection[lecturer.id])
  const targets = selected.map((lecturer) => ({ id: lecturer.id, name: lecturer.name, identifier: lecturer.dosen.nidn, status: lecturer.dosen.status }))
  const searchPending = searchInput !== search
  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []
  const clearSelection = () => setRowSelection({})

  useEffect(() => {
    if (searchInput === search) return
    const timer = window.setTimeout(() => dispatch(setSearch(searchInput)), 400)
    return () => window.clearTimeout(timer)
  }, [dispatch, searchInput, search])

  useEffect(() => {
    const request = dispatch(getAllLecturers({ page, limit, search, sortBy, sortOrder }))
    return () => request.abort()
  }, [dispatch, page, limit, search, sortBy, sortOrder])

  const refresh = () => dispatch(getAllLecturers({ page, limit, search, sortBy, sortOrder }))
  const openAction = (next: BulkKind) => {
    if (busy || isLoadingLecturers || searchPending || !selected.length) return
    setStatus("Aktif")
    setKind(next)
  }
  const confirmAction = async () => {
    if (!kind || !selected.length || requestLock.current || busy) return
    const ids = selected.filter((lecturer) => kind === "delete" || lecturer.dosen.status !== status).map((lecturer) => lecturer.id)
    if (!ids.length) return
    requestLock.current = true
    setProcessing(true)
    const input: BulkLecturerAction = kind === "delete" ? { kind, ids } : { kind, ids, status }
    try {
      const result = await dispatch(bulkMutateLecturers(input)).unwrap()
      clearSelection()
      setKind(null)
      const remaining = Math.max(0, (totalRows ?? lecturers.length) - result.ids.length)
      const nextPage = kind === "delete" ? Math.min(page, Math.max(1, Math.ceil(remaining / limit))) : page
      if (nextPage !== page) dispatch(setPage(nextPage))
      else await refresh() // A refresh error is shown inline, not as a second mutation toast.
    } catch {
      // Keep the dialog and selection intact; middleware owns the single error toast.
    } finally {
      requestLock.current = false
      setProcessing(false)
    }
  }
  const onSort = (next: SortingState) => {
    if (busy) return
    clearSelection()
    const first = next[0]
    dispatch(setSorting(first ? { sortBy: first.id, sortOrder: first.desc ? "desc" : "asc" } : { sortBy: "name", sortOrder: "asc" }))
  }
  return <>
    <div className="container mx-auto mt-4 space-y-3">
      <h1 className="text-2xl font-semibold">Data Dosen</h1>
      {lecturerListError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm"><span>{lecturerListError}</span><Button variant="outline" size="sm" disabled={busy} onClick={() => { clearSelection(); void refresh() }}>Muat Ulang Daftar</Button></div>}
      <div inert={busy} aria-busy={busy}>
        <DataTable columns={dosenColumns} data={lecturers} searchValue={searchInput} searchPlaceholder="Cari nama atau NIDN dosen..." onSearchChange={(value) => { clearSelection(); setSearchInput(value) }} rowSelection={rowSelection} onRowSelectionChange={setRowSelection} getRowId={(lecturer) => lecturer.id} selectionDisabled={busy || isLoadingLecturers || searchPending || !!lecturerListError} isLoading={isLoadingLecturers || searchPending} toolbar={<BulkActionsToolbar count={selected.length} entity="dosen" busy={busy || isLoadingLecturers || searchPending || !!lecturerListError} onAction={openAction} onClear={clearSelection} />} pageIndex={page - 1} pageCount={totalPages} onPageChange={(index) => { clearSelection(); dispatch(setPage(index + 1)) }} sorting={sorting} onSortingChange={onSort} />
      </div>
    </div>
    <BulkActionDialog kind={kind} entity="dosen" targets={targets} busy={busy} status={status} statusOptions={statusOptions} onStatusChange={(value) => setStatus(value as typeof status)} deleteDescription={`Akun dan profil ${targets.length} dosen akan dihapus permanen. Dosen yang masih memiliki kelas atau mahasiswa bimbingan tidak dapat dihapus. Tindakan ini tidak dapat dibatalkan.`} onClose={() => setKind(null)} onConfirm={() => { void confirmAction() }} />
  </>
}
