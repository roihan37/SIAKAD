
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createLecturer, getAllLecturers } from "../action/dosenThunk";
import type { DosenState } from "@/types/state";

const initialState: DosenState = {
    error: null,
    lecturers: [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "asc",


    isLoadingLecturers: false,
    isCreatingLecturer: false

}
const dosenSilce = createSlice({
    name: 'lecturers',
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


            // LECTURERS
            .addCase(getAllLecturers.pending, state => {
                state.isLoadingLecturers = true
            })
            .addCase(getAllLecturers.fulfilled, (state, action) => {
                state.isLoadingLecturers = false
                state.lecturers = action.payload.lecturers
                state.page = action.payload.pagination.page;
                state.limit = action.payload.pagination.limit;
                state.totalPages = action.payload.pagination.totalPages;
                state.totalRows = action.payload.pagination.totalRows;
            })
            .addCase(getAllLecturers.rejected, (state, action) => {
                state.isLoadingLecturers = false
                state.error = action.payload as string;
            })


            .addCase(createLecturer.pending, state => {
                state.isCreatingLecturer = true
            })
            .addCase(createLecturer.fulfilled, (state) => {
                state.isCreatingLecturer = false
            })
            .addCase(createLecturer.rejected, (state, action) => {
                state.isCreatingLecturer = false
                state.error =
                    typeof action.payload === "string"
                        ? action.payload
                        : action.error.message ?? "Gagal membuat mahasiswa."
            })

    }
})
export const { setPage, setSearch, setSorting } = dosenSilce.actions;
export default dosenSilce.reducer