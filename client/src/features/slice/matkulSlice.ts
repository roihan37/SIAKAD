import type { MataKuliahState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getAllMatkul } from "../action/matkulThunk";

const initialState : MataKuliahState ={
    isLoading : false,
    error : null,
    matkul : [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "desc",
}
const matkulSlice = createSlice({
    name : 'matkul',
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

        // MATA KULIAH
        .addCase(getAllMatkul.pending, state => {
            state.isLoading = true
        })
        .addCase(getAllMatkul.fulfilled, (state, action) => {
            state.isLoading = false
            state.matkul = action.payload.mataKuliah
            state.page = action.payload.pagination.page;
            state.limit = action.payload.pagination.limit;
            state.totalPages = action.payload.pagination.totalPages;
            state.totalRows = action.payload.pagination.totalRows;
        })
        .addCase(getAllMatkul.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })


    }
})
export const { setPage, setSearch, setSorting } = matkulSlice.actions;
export default matkulSlice.reducer