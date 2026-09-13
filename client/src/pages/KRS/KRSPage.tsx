import { useSearchParams } from "react-router"
import { KRSEditDialog } from "./KRSEditDialog"
import { MasterDeleteDialog } from "@/components/master-data/MasterDeleteDialog"
import { ActionCell } from "@/components/tables/action-cell"
import type { ColumnDef } from "@tanstack/react-table"
import type { KRS } from "@/types/campus"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/data-table"
import { setAngkatan, setPage, setProdiId, setSearch, setSorting, setStatus } from "@/features/slice/KRSSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { krsColumns } from "@/components/tables/column/krsColumns"
import { getAllKRS } from "@/features/action/krsThunk"
import { getAllTAkademik } from "@/features/action/tAkademikThunk"
import { getAllProdi } from "@/features/action/campusThunk"
import type { ComboboxOption } from "@/types/combobox"
import { PageFilters } from "@/components/PageFilters"
import { filtersData } from "@/components/filters-data"
import { KRSSummary } from "@/components/KRSSummary"

export default function KRSPage() {
    const tableLoading = useAppSelector((state) => state.krs.isLoading)
  const dispatch = useAppDispatch()
  const [params, setParams] = useSearchParams()
  const yearParam = params.get("tahunAkademikId")
  const tahunAkademikId = yearParam && /^\d+$/.test(yearParam) && Number(yearParam) > 0 ? Number(yearParam) : undefined
  const changeYear = (id?: number) => {
    setParams((previous) => { const next = new URLSearchParams(previous); if (id) next.set("tahunAkademikId", String(id)); else next.delete("tahunAkademikId"); return next })
    dispatch(setPage(1))
  }
  const {
    krs,
    page,
    totalPages,
    search,
    sortBy,
    sortOrder,
    angkatan,
    prodiId,
    status,
    totalMahasiswaAktif,
    totalKRSDraft,
    totalKRSDitolak,
    totalKRSDisetujui,
    totalKRSMenunggu,
    totalBelumKRS
  } = useAppSelector((state) => state.krs)
  const { tAkademik } = useAppSelector((state) => state.tAkademik)
  const { prodi } = useAppSelector((state) => state.campus)
  const [editing, setEditing] = useState<KRS | null>(null)
  const [deleting, setDeleting] = useState<KRS | null>(null)
  const columns = useMemo<ColumnDef<KRS>[]>(() => {
    return [...krsColumns.filter((column) => column.id !== "actions"), { id: "actions", cell: ({ row }) => row.original.krsId ? <ActionCell row={row.original} onEdit={setEditing} onDelete={setDeleting} /> : <span className="text-xs text-muted-foreground">Belum ada KRS</span> }]
  }, [])
  const refreshTable = async () => {
    try { await dispatch(getAllKRS({ page, limit: 10, search, sortBy, sortOrder, prodiId, tahunAkademikId, angkatan, status })).unwrap() }
    catch { toast.error("Perubahan tersimpan, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman.") }
  }
  const [searchInput, setSearchInput] = useState(search)
  const sorting: SortingState = sortBy ? [{ id: sortBy, desc: sortOrder === "desc" }] : []

  const handleSortingChange = (next: SortingState) => {
    if (next.length === 0) {
      dispatch(setSorting({ sortBy: "name", sortOrder: "asc" }))
      return
    }
    const { id, desc } = next[0]
    dispatch(setSorting({ sortBy: id, sortOrder: desc ? "desc" : "asc" }))
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(setSearch(searchInput))
    }, 400)
    return () => clearTimeout(timeout)
  }, [searchInput, dispatch])

  useEffect(() => {
    let active = true
    const request = dispatch(
      getAllKRS({
        page,
        search,
        sortBy,
        sortOrder,
        tahunAkademikId,
        prodiId,
        angkatan,
        status,
      })
    )
    void request.unwrap().then((response) => {
      if (active && !tahunAkademikId) setParams((previous) => {
        const next = new URLSearchParams(previous)
        next.set("tahunAkademikId", String(response.academicYear.id))
        return next
      }, { replace: true })
    }).catch(() => {})
    return () => { active = false; request.abort() }
  }, [
    dispatch,
    setParams,
    page,
    search,
    sortBy,
    sortOrder,
    tahunAkademikId,
    prodiId,
    angkatan,
    status,
  ])

  useEffect(() => {
    dispatch(
      getAllTAkademik({
        page: 1,
        limit: 1000,
      })
    )
  }, [dispatch])

  useEffect(() => {
    dispatch(
      getAllProdi({
        page: 1,
        limit: 1000,
      })
    )
  }, [dispatch])

  const {
    tahunAkademikItems,
    prodiItems,
    statusKRSItems,
    angkatanItems }
    = filtersData({
      tAkademik,
      prodi
    })

  const krsFilters = [
    {
      key: "tahunAkademik",
      items: tahunAkademikItems.filter((item) => item.id !== 0),

      value:
        tahunAkademikItems.find(
          (item) =>
            item.id ===
            (tahunAkademikId ?? 0)
        ),

      placeholder: "Tahun Akademik",
      width: "w-full sm:w-56",

      onChange: (
        item: ComboboxOption
      ) => {
        changeYear(item.id || undefined)
      },
    },

    {
      key: "prodi",
      items: prodiItems,

      value:
        prodiItems.find(
          (item) =>
            item.id ===
            (prodiId ?? 0)
        ),

      placeholder: "Program Studi",
      width: "w-full sm:w-56",

      onChange: (
        item: ComboboxOption
      ) => {
        dispatch(
          setProdiId(
            item.id === 0
              ? undefined
              : item.id
          )
        )
      },
    },

    {
      key: "angkatan",
      items: angkatanItems,

      value:
        angkatanItems.find(
          (item) =>
            item.id ===
            (angkatan ?? 0)
        ),

      placeholder: "Angkatan",
      width: "w-full sm:w-44",

      onChange: (
        item: ComboboxOption
      ) => {
        dispatch(
          setAngkatan(
            item.id === 0
              ? undefined
              : item.id
          )
        )
      },
    },

    {
      key: "status",
      items: statusKRSItems,

      value:
        statusKRSItems.find(
          (item) =>
            item.value === status
        ),

      placeholder: "Status KRS",
      width: "w-full sm:w-44",

      onChange: (
        item: ComboboxOption
      ) => {
        dispatch(
          setStatus(
            item.value === "ALL"
              ? undefined
              : String(item.value)
          )
        )
      },
    },
  ]

  return (
    <>
      <div className="container mx-auto  py-4">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            KRS
          </h1>

          <p className="text-sm text-muted-foreground">
            Kelola dan monitor KRS mahasiswa. Ringkasan mengikuti seluruh filter tabel.
          </p>
        </div>

        {/* Summary */}

        <DataTable
                    isLoading={tableLoading}
          columns={columns}
          data={krs}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          pageIndex={page - 1}
          pageCount={totalPages}
          onPageChange={(newIndex) => dispatch(setPage(newIndex + 1))}
          sorting={sorting}
          onSortingChange={handleSortingChange}

          toolbar={
            <PageFilters
              filters={krsFilters}
              onReset={() => {
                changeYear(undefined)

                dispatch(
                  setProdiId(undefined)
                )

                dispatch(
                  setAngkatan(undefined)
                )

                dispatch(
                  setStatus(undefined)
                )
              }}
            />
          }

          toolbar2={
            <KRSSummary
              data={{
                totalMahasiswa: totalMahasiswaAktif,
                draft: totalKRSDraft,
                ditolak: totalKRSDitolak,
                krsSelesai: totalKRSDisetujui,
                menunggu: totalKRSMenunggu,
                belumKRS: totalBelumKRS,
              }}
            />
          }
        />
      </div>
      {editing && <KRSEditDialog key={String(editing.krsId)} row={editing} onClose={() => setEditing(null)} onSaved={() => {
        setEditing(null)
        toast.success("KRS berhasil diperbarui")
        void refreshTable()
      }} />}
      {deleting && deleting.krsId && <MasterDeleteDialog module="krs" name={`KRS ${deleting.nama} (${deleting.nim})`} id={deleting.krsId} onClose={() => setDeleting(null)} onDeleted={() => {
        setDeleting(null)
        toast.success("KRS berhasil dihapus")
        void refreshTable()
      }} />}
    </>
  )
}