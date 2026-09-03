import type { ProgramStudi, TahunAkademik } from "@/types/campus";
import type { ComboboxOption } from "@/types/combobox";

interface Filter {
    tAkademik: TahunAkademik[]
    prodi: ProgramStudi[]
}

export function filtersData({
    tAkademik,
    prodi,

}: Filter)
    : {
        tahunAkademikItems: ComboboxOption[],
        prodiItems: ComboboxOption[],
        statusKRSItems: ComboboxOption[],
        angkatanItems: ComboboxOption[]
    } {

    const tahunAkademikItems: ComboboxOption[] = [
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

    const prodiItems: ComboboxOption[] = [
        {
            id: 0,
            label: "Semua Program Studi",
        },

        ...prodi.map((item) => ({
            id: item.id,
            label: item.name,
        })),
    ]

    const statusKRSItems: ComboboxOption[] = [
        {
            id: 0,
            label: "Semua Status",
            value: "ALL",
        },
        {
            id: 1,
            label: "Belum KRS",
            value: "BELUM_KRS",
        },
        {
            id: 2,
            label: "Menunggu",
            value: "MENUNGGU",
        },
        {
            id: 3,
            label: "Disetujui",
            value: "DISETUJUI",
        },
        {
            id: 4,
            label: "Ditolak",
            value: "DITOLAK",
        },
    ]
    const angkatanItems: ComboboxOption[] = [
        {
            id: 0,
            label: "Semua Angkatan",
        },
        {
            id: 2026,
            value: 2026,
            label: "2026",
        },
        {
            id: 2025,
            value: 2025,
            label: "2025",
        },
        {
            id: 2024,
            value: 2024,
            label: "2024",
        },
        {
            id: 2023,
            value: 2023,
            label: "2023",
        },
        {
            id: 2022,
            value: 2022,
            label: "2022",
        },
    ]

    return {
        tahunAkademikItems,
        prodiItems,
        statusKRSItems,
        angkatanItems
    }
}