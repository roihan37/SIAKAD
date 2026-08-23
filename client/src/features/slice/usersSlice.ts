import type { UsersState } from "@/types/state";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { createStudent, getAllLecturers, getAllStudents } from "../action/usersThunk";

const initialState : UsersState ={
    isLoading : false,
    error : null,
    students : [],
    lecturers : [],
    search: "",
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
    sortBy: "name",
    sortOrder: "asc",
}
const usersSilce = createSlice({
    name : 'users',
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
        .addCase(getAllStudents.pending, state => {
            state.isLoading = true
        })
        .addCase(getAllStudents.fulfilled, (state, action) => {
            state.isLoading = false
            state.students = action.payload.students
            state.page = action.payload.pagination.page;
            state.limit = action.payload.pagination.limit;
            state.totalPages = action.payload.pagination.totalPages;
            state.totalRows = action.payload.pagination.totalRows;
        })
        .addCase(getAllStudents.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })

        // ADD STUDENTS
        .addCase(createStudent.pending, state => {
            state.isLoading = true
        })
        .addCase(createStudent.fulfilled, (state) => {
            state.isLoading = false
        })
        .addCase(createStudent.rejected, (state, action) =>{
            state.isLoading = false
            state.error =
                typeof action.payload === "string"
                ? action.payload
                : action.error.message ?? "Gagal membuat mahasiswa."
        })

        // LECTURERS
        .addCase(getAllLecturers.pending, state => {
            state.isLoading = true
        })
        .addCase(getAllLecturers.fulfilled, (state, action) => {
            state.isLoading = false
            state.lecturers = action.payload.lecturers
            state.page = action.payload.pagination.page;
            state.limit = action.payload.pagination.limit;
            state.totalPages = action.payload.pagination.totalPages;
            state.totalRows = action.payload.pagination.totalRows;
        })
        .addCase(getAllLecturers.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })


    }
})
export const { setPage, setSearch, setSorting } = usersSilce.actions;
export default usersSilce.reducer