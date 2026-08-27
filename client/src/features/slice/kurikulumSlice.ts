import type { KurikulumState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createKurikulum, getAllKurikulum } from "../action/kurikulumThunk";

const initialState: KurikulumState = {
    isLoading: false,
    error: null,
    kurikulum: [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "desc",

    isCreatingKurikulum: false
}
const kurikulumSlice = createSlice({
    name: 'kurikulum',
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

            .addCase(createKurikulum.pending, state => {
                state.isCreatingKurikulum = true
            })
            .addCase(createKurikulum.fulfilled, (state) => {
                state.isCreatingKurikulum = false
            })
            .addCase(createKurikulum.rejected, (state, action) => {
                state.isCreatingKurikulum = false
                state.error =
                    typeof action.payload === "string"
                        ? action.payload
                        : action.error.message ?? "Gagal membuat mahasiswa."
            })


            .addCase(getAllKurikulum.pending, state => {
                state.isLoading = true
            })
            .addCase(getAllKurikulum.fulfilled, (state, action) => {
                state.isLoading = false
                state.kurikulum = action.payload.kurikulum
                state.page = action.payload.pagination.page;
                state.limit = action.payload.pagination.limit;
                state.totalPages = action.payload.pagination.totalPages;
                state.totalRows = action.payload.pagination.totalRows;
            })
            .addCase(getAllKurikulum.rejected, (state, action) => {
                state.isLoading = false
                state.error = action.payload as string;
            })


    }
})
export const { setPage, setSearch, setSorting } = kurikulumSlice.actions;
export default kurikulumSlice.reducer