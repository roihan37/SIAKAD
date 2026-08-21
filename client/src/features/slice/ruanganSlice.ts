import type { RuanganState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getAllRuangan } from "../action/ruanganThunk";

const initialState : RuanganState ={
    isLoading : false,
    error : null,
    ruangan : [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "asc",
}
const ruanganSilce = createSlice({
    name : 'ruangan',
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

        // STUDENTS
        .addCase(getAllRuangan.pending, state => {
            state.isLoading = true
        })
        .addCase(getAllRuangan.fulfilled, (state, action) => {
            state.isLoading = false
            state.ruangan = action.payload.ruangan
            state.page = action.payload.pagination.page;
            state.limit = action.payload.pagination.limit;
            state.totalPages = action.payload.pagination.totalPages;
            state.totalRows = action.payload.pagination.totalRows;
        })
        .addCase(getAllRuangan.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })


    }
})
export const { setPage, setSearch, setSorting } = ruanganSilce.actions;
export default ruanganSilce.reducer