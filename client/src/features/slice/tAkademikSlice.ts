import type { TahunAkaState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createTAkademik, getAllTAkademik } from "../action/tAkademikThunk";

const initialState: TahunAkaState = {
    isLoading: false,
    error: null,
    tAkademik: [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "desc",

    isCreatingTAkademik: false
}
const tAkademikSilce = createSlice({
    name: 'tahun-akademik',
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
    },

    extraReducers(builder) {
        builder

            .addCase(createTAkademik.pending, state => {
                state.isCreatingTAkademik = true
            })
            .addCase(createTAkademik.fulfilled, (state) => {
                state.isCreatingTAkademik = false
            })
            .addCase(createTAkademik.rejected, (state, action) => {
                state.isCreatingTAkademik = false
                state.error =
                    typeof action.payload === "string"
                        ? action.payload
                        : action.error.message ?? "Gagal membuat mahasiswa."
            })

            .addCase(getAllTAkademik.pending, state => {
                state.isLoading = true
            })
            .addCase(getAllTAkademik.fulfilled, (state, action) => {
                state.isLoading = false
                state.tAkademik = action.payload.tahunAkademik
                state.page = action.payload.pagination.page;
                state.limit = action.payload.pagination.limit;
                state.totalPages = action.payload.pagination.totalPages;
                state.totalRows = action.payload.pagination.totalRows;
            })
            .addCase(getAllTAkademik.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string;
            })


    }
})
export const { setPage, setSearch, setSorting } = tAkademikSilce.actions;
export default tAkademikSilce.reducer