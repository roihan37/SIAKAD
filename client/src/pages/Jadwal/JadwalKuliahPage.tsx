import { JadwalEditDialog } from "./JadwalEditDialog"
import { MasterDeleteDialog } from "@/components/master-data/MasterDeleteDialog"
import { createActionColumn } from "@/components/tables/action-column"
import type { Jadwal } from "@/types/campus"
import { toast } from "sonner"
import { DataTable } from "@/components/tables/data-table"
import { getAllProdi } from "@/features/action/campusThunk"
import { setPage, setProdiId, setSearch, setSorting, setTahunAkademikId } from "@/features/slice/jadwalSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useMemo, useState } from "react"
import { getAllJadwal } from "@/features/action/jadwalThunk"
import { jadwalColumns } from "@/components/tables/column/jadwalColumns"
import { getAllTAkademik } from "@/features/action/tAkademikThunk"
import type { ComboboxOption } from "@/types/combobox"
import { PageFilters } from "@/components/PageFilters"
import { filtersData } from "@/components/filters-data"



export default function JadwalPage() {
    const tableLoading = useAppSelector((state) => state.jadwal.isLoading)
  const dispatch = useAppDispatch()

  const {
    jadwal,
    page,
    totalPages,
    search,
    sortBy,
    sortOrder,
    prodiId,
    tahunAkademikId,
  } = useAppSelector((state) => state.jadwal)

  const { prodi } = useAppSelector((state) => state.campus)

  const { tAkademik } = useAppSelector((state) => state.tAkademik)

  const [editing, setEditing] = useState<Jadwal | null>(null)
  const [deleting, setDeleting] = useState<Jadwal | null>(null)
  const columns = useMemo(() => {
    const actions = { ...createActionColumn<Jadwal>(setEditing, setDeleting), meta: { label: "Aksi" } }
    return [...jadwalColumns.filter((column) => column.id !== "actions"), actions]
  }, [])
  const refreshTable = async () => {
    try { await dispatch(getAllJadwal({ page, limit: 10, search, sortBy, sortOrder, prodiId, tahunAkademikId })).unwrap() }
    catch { toast.error("Perubahan tersimpan, tetapi tabel gagal dimuat ulang. Silakan muat ulang halaman.") }
  }
  const [searchInput, setSearchInput] = useState(search)

  const sorting: SortingState =
    sortBy ? [
      {
        id: sortBy,
        desc: sortOrder === "desc",
      },
    ]
      : []

  const handleSortingChange = (
    next: SortingState
  ) => {
    if (next.length === 0) {
      dispatch(setSorting({ sortBy: "jamMulai", sortOrder: "asc" }))
      return
    }

    const { id, desc } = next[0]

    dispatch(setSorting({
      sortBy: id,
      sortOrder: desc
        ? "desc"
        : "asc"
    }))
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(
        setSearch(searchInput)
      )
    }, 400)

    return () =>
      clearTimeout(timeout)
  }, [
    searchInput,
    dispatch,
  ])

  // ==========================================
  // GET JADWAL
  // ==========================================

  useEffect(() => {
    dispatch(
      getAllJadwal({
        page,
        limit: 10,
        search,
        sortBy,
        sortOrder,
        prodiId,
        tahunAkademikId,
      })
    )
  }, [
    dispatch,
    page,
    search,
    sortBy,
    sortOrder,
    prodiId,
    tahunAkademikId,
  ])

  // ==========================================
  // GET PRODI
  // ==========================================

  useEffect(() => {
    dispatch(
      getAllProdi({
        page: 1,
        limit: 1000,
      })
    )
  }, [dispatch])

  // ==========================================
  // GET TAHUN AKADEMIK
  // ==========================================

  useEffect(() => {
    dispatch(getAllTAkademik({ page: 1, limit: 1000, }))
  }, [dispatch])


  const {
      tahunAkademikItems, 
      prodiItems} 
      = filtersData({
      tAkademik,
      prodi
    })

  const jadwalFilters = [
    {
      key: "tahunAkademik",
      items: tahunAkademikItems,
      value: tahunAkademikItems.find(
        (item) =>
          item.id ===
          (tahunAkademikId ?? 0)
      ),
      placeholder: "Tahun Akademik",
      width: "w-full sm:w-56",

      onChange: (item: ComboboxOption) => {
        dispatch(
          setTahunAkademikId(
            item.id === 0
              ? undefined
              : item.id
          )
        )
      },
    },

    {
      key: "prodi",
      items: prodiItems,
      value: prodiItems.find(
        (item) =>
          item.id ===
          (prodiId ?? 0)
      ),
      placeholder: "Program Studi",
      width: "w-full sm:w-56",

      onChange: (item: ComboboxOption) => {
        dispatch(
          setProdiId(
            item.id === 0
              ? undefined
              : item.id
          )
        )
      },
    },
  ]

  return (
    <>
    <div className="container mx-auto mt-4 ">
      <div >

        <div className="text-2xl font-medium">
          Jadwal Kuliah
        </div>

        <p className="text-sm text-muted-foreground">
          Kelola jadwal perkuliahan berdasarkan
          tahun akademik dan program studi.
        </p>
      </div>


      <DataTable
                    isLoading={tableLoading}
        columns={columns}
        data={jadwal}

        selectedProdiId={prodiId}
        selectedTahunAkademikId={
          tahunAkademikId
        }

        onProdiChange={(value) => {
          dispatch(setProdiId(value))
        }}

        onTahunAkademikChange={(value) => {
          dispatch(
            setTahunAkademikId(value)
          )
        }}

        searchValue={searchInput}
        onSearchChange={setSearchInput}

        pageIndex={page - 1}
        pageCount={totalPages}

        onPageChange={(newIndex) => {
          dispatch(
            setPage(newIndex + 1)
          )
        }}

        sorting={sorting}
        onSortingChange={
          handleSortingChange
        }
        toolbar={
          <PageFilters
            filters={jadwalFilters}
            onReset={() => {
              dispatch(
                setTahunAkademikId(undefined)
              )

              dispatch(
                setProdiId(undefined)
              )
            }}
          />}

      />
    </div>
      {editing && <JadwalEditDialog key={String(editing.id)} row={editing} onClose={() => setEditing(null)} onSaved={() => {
        setEditing(null)
        toast.success("Jadwal berhasil diperbarui")
        void refreshTable()
      }} />}
      {deleting && deleting.id != null && <MasterDeleteDialog module="jadwal" name={`Jadwal ${deleting.mataKuliah} (${deleting.hari}, ${deleting.jam})`} id={deleting.id!} onClose={() => setDeleting(null)} onDeleted={() => {
        setDeleting(null)
        toast.success("Jadwal berhasil dihapus")
        if (jadwal.length === 1 && page > 1) dispatch(setPage(page - 1))
        else void refreshTable()
      }} />}
    </>
  )
}