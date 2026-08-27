import type { JadwalState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createJadwal, getAllJadwal } from "../action/jadwalThunk";

const initialState: JadwalState = {
    isLoading: false,
    error: null,
    jadwal: [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "desc",
    prodiId: undefined,
    tahunAkademikId : undefined,

    isCreatingJadwal: false
}
const jadwalSilce = createSlice({
    name: 'jadwal',
    initialState,
    reducers: {
        setPage: (state, action: PayloadAction<number>) => {
            state.page = action.payload
        },
        setSearch: (state, action: PayloadAction<string>) => {
            state.search = action.payload
            state.page = 1
        },
        setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: "asc" | "desc" }>) => {
            state.sortBy = action.payload.sortBy
            state.sortOrder = action.payload.sortOrder
            state.page = 1
        },
        setProdiId: (
            state,
            action: PayloadAction<number | undefined>
        ) => {
            state.prodiId = action.payload
            state.page = 1
        },

        setTahunAkademikId: (
            state,
            action: PayloadAction<number | undefined>
        ) => {
            state.tahunAkademikId = action.payload
            state.page = 1
        },
    },

    extraReducers(builder) {
        builder

            .addCase(createJadwal.pending, state => {
                state.isCreatingJadwal = true
            })
            .addCase(createJadwal.fulfilled, (state) => {
                state.isCreatingJadwal = false
            })
            .addCase(createJadwal.rejected, (state, action) => {
                state.isCreatingJadwal = false
                state.error =
                    typeof action.payload === "string"
                        ? action.payload
                        : action.error.message ?? "Gagal membuat mahasiswa."
            })

            // STUDENTS
            .addCase(getAllJadwal.pending, state => {
                state.isLoading = true
            })
            .addCase(getAllJadwal.fulfilled, (state, action) => {
                state.isLoading = false
                state.jadwal = action.payload.jadwal
                state.page = action.payload.pagination.page;
                state.limit = action.payload.pagination.limit;
                state.totalPages = action.payload.pagination.totalPages;
                state.totalRows = action.payload.pagination.totalRows;
            })
            .addCase(getAllJadwal.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string;
            })


    }
})
export const { setPage, setSearch, setSorting, setProdiId, setTahunAkademikId } = jadwalSilce.actions;
export default jadwalSilce.reducer