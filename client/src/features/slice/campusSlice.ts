import type { CampusState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getAllFakultas, getAllProdi } from "../action/campusThunk";

const initialState : CampusState ={
    isLoading : false,
    error : null,
    fakultas : [],
    prodi : [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "asc",
}
const campusSilce = createSlice({
    name : 'campus',
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

        // FAKULTAS
        .addCase(getAllFakultas.pending, state => {
            state.isLoading = true
        })
        .addCase(getAllFakultas.fulfilled, (state, action) => {
            state.isLoading = false
            state.fakultas = action.payload.fakultas
            state.page = action.payload.pagination.page;
            state.limit = action.payload.pagination.limit;
            state.totalPages = action.payload.pagination.totalPages;
            state.totalRows = action.payload.pagination.totalRows;
        })
        .addCase(getAllFakultas.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })

        // PRODI
        .addCase(getAllProdi.pending, state => {
            state.isLoading = true
        })
        .addCase(getAllProdi.fulfilled, (state, action) => {
            state.isLoading = false
            state.prodi = action.payload
            state.page = action.payload.pagination.page;
            state.limit = action.payload.pagination.limit;
            state.totalPages = action.payload.pagination.totalPages;
            state.totalRows = action.payload.pagination.totalRows;
        })
        .addCase(getAllProdi.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })


    }
})
export const { setPage, setSearch, setSorting } = campusSilce.actions;
export default campusSilce.reducer