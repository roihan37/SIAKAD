import type { KRSState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createKRS, getAllKRS } from "../action/krsThunk";

const initialState: KRSState = {
    isLoading: false,
    error: null,
    krs: [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "desc",
    prodiId: undefined,
    tahunAkademikId: undefined,
    angkatan: undefined,
    status: undefined,
    totalMahasiswaAktif: 0,
    totalKRSDisetujui: 0,
    totalKRSMenunggu: 0,
    totalBelumKRS: 0,
    
    isCreatingKRS: false
}
const krsSilce = createSlice({
    name: 'krs',
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

        setAngkatan: (
            state,
            action: PayloadAction<number | undefined>
        ) => {
            state.angkatan = action.payload
            state.page = 1
        },

        setStatus: (
            state,
            action: PayloadAction<string | undefined>
        ) => {
            state.status =
                action.payload

            state.page = 1
        },

    },

    extraReducers(builder) {
        builder

            .addCase(createKRS.pending, state => {
                state.isCreatingKRS = true
            })
            .addCase(createKRS.fulfilled, (state) => {
                state.isCreatingKRS = false
            })
            .addCase(createKRS.rejected, (state, action) => {
                state.isCreatingKRS = false
                state.error =
                    typeof action.payload === "string"
                        ? action.payload
                        : action.error.message ?? "Gagal membuat mahasiswa."
            })

            // STUDENTS
            .addCase(getAllKRS.pending, state => {
                state.isLoading = true
            })
            .addCase(getAllKRS.fulfilled, (state, action) => {
                state.isLoading = false
                state.krs = action.payload.krs
                state.page = action.payload.pagination.page;
                state.limit = action.payload.pagination.limit;
                state.totalPages = action.payload.pagination.totalPages;
                state.totalRows = action.payload.pagination.totalRows;
                state.totalMahasiswaAktif = action.payload.summary.totalMahasiswaAktif;
                state.totalKRSDisetujui = action.payload.summary.totalKRSDisetujui;
                state.totalKRSMenunggu = action.payload.summary.totalKRSMenunggu;
                state.totalBelumKRS = action.payload.summary.totalBelumKRS;
                // console.log("action.payload", action.payload);
            })
            .addCase(getAllKRS.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string;
            })


    }
})
export const { setPage, setSearch, setSorting, setProdiId, setTahunAkademikId, setAngkatan, setStatus } = krsSilce.actions;
export default krsSilce.reducer