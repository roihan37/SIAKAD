import { DataTable } from "@/components/tables/data-table"
import { getAllProdi } from "@/features/action/campusThunk"
import { setPage, setProdiId, setSearch, setSorting, setTahunAkademikId } from "@/features/slice/jadwalSlice"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import type { SortingState } from "@tanstack/react-table"
import { useEffect, useState } from "react"
import { getAllJadwal } from "@/features/action/jadwalThunk"
import { jadwalColumns } from "@/components/tables/column/jadwalColumns"
import { getAllTAkademik } from "@/features/action/tAkademikThunk"
import type { ComboboxItemType } from "@/types/campus"
import { RotateCcw } from "lucide-react"
import { ComboboxPopup } from "@/components/combobox"
import { Button } from "@/components/ui/button"



export default function JadwalPage() {
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


  const prodiItems: ComboboxItemType[] = [
    {
      id: 0,
      label: "Semua Program Studi",
    },

    ...prodi.map((item) => ({
      id: item.id,
      label: item.name,
    })),
  ]
  const tahunAkademikItems: ComboboxItemType[] = [
    {
      id: 0,
      label: "Semua Tahun Akademik",
    },

    ...(tAkademik ?? [])
      .filter(
        (item): item is typeof item & { id: number } =>
          item.id !== undefined
      )
      .map((item) => ({
        id: item.id,
        label: `${item.tahun} - ${item.semester}`,
      })),
  ]

  const jadwalFilter = (
  <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-2 sm:flex-row sm:items-center">

    <div className="hidden shrink-0 px-2 text-sm font-medium text-muted-foreground sm:block">
      Filter
    </div>

    <div className="w-full sm:w-64">
      <ComboboxPopup
        items={tahunAkademikItems ?? []}
        value={tahunAkademikItems?.find(
          (item) =>
            item.id ===
            (tahunAkademikId ?? 0)
        )}
        placeholder="Tahun Akademik"
        onValueChange={(item) => {
          dispatch(
            setTahunAkademikId(
              item.id === 0
                ? undefined
                : item.id
            )
          )
        }}
      />
    </div>

    <div className="w-full sm:w-64">
      <ComboboxPopup
        items={prodiItems ?? []}
        value={prodiItems?.find(
          (item) =>
            item.id ===
            (prodiId ?? 0)
        )}
        placeholder="Program Studi"
        onValueChange={(item) => {
          dispatch(
            setProdiId(
              item.id === 0
                ? undefined
                : item.id
            )
          )
        }}
      />
    </div>

    {(prodiId !== undefined ||
      tahunAkademikId !== undefined) && (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          dispatch(
            setProdiId(undefined)
          )

          dispatch(
            setTahunAkademikId(
              undefined
            )
          )
        }}
      >
        <RotateCcw className="size-4" />
        Reset
      </Button>
    )}
  </div>
)

  return (
    <div className="container mx-auto mt-4 px-4">
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
        columns={jadwalColumns}
        data={jadwal}

        prodi={prodiItems}
        tahunAkademik={
          tahunAkademikItems
        }

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
        toolbar={jadwalFilter}

      />
    </div>
  )
}