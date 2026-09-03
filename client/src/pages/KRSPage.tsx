import { DataTable } from "@/components/tables/data-table"
import { setAngkatan, setPage, setProdiId, setSearch, setSorting, setStatus, setTahunAkademikId } from "@/features/slice/KRSSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { krsColumns } from "@/components/tables/column/krsColumns"
import { getAllKRS } from "@/features/action/krsThunk"
import { getAllTAkademik } from "@/features/action/tAkademikThunk"
import { getAllProdi } from "@/features/action/campusThunk"
import type { ComboboxOption } from "@/types/combobox"
import { PageFilters } from "@/components/PageFilters"
import { filtersData } from "@/components/filters-data"
import { KRSSummary } from "@/components/KRSSummary"

export default function KRSPage() {
  const dispatch = useAppDispatch()
  const {
    krs,
    page,
    totalPages,
    search,
    sortBy,
    sortOrder,
    angkatan,
    tahunAkademikId,
    prodiId,
    status,
    totalMahasiswaAktif,
    totalKRSDisetujui,
    totalKRSMenunggu,
    totalBelumKRS
  } = useAppSelector((state) => state.krs)
  const { tAkademik } = useAppSelector((state) => state.tAkademik)
  const { prodi } = useAppSelector((state) => state.campus)
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
    dispatch(
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
  }, [
    dispatch,
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
      items: tahunAkademikItems,

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
            Kelola dan monitor KRS mahasiswa
          </p>
        </div>

        {/* Summary */}

        <DataTable
          columns={krsColumns}
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
                dispatch(
                  setTahunAkademikId(undefined)
                )

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
                krsSelesai: totalKRSDisetujui,
                menunggu: totalKRSMenunggu,
                belumKRS: totalBelumKRS,
              }}
            />
          }
        />
      </div>
    </>
  )
}