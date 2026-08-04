import type { UsersState } from "@/types/state";
import { createSlice } from "@reduxjs/toolkit";
import { getAllLecturers, getAllStudents } from "../action/usersThunk";

const initialState : UsersState ={
    isLoading : false,
    error : null,
    students : [],
    lecturers : [],
    page: 1,
    limit: 10,
    totalPages: 1,
    totalRows: 0,
}
const usersSilce = createSlice({
    name : 'users',
    initialState,
    reducers : {

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

        // LECTURERS
        .addCase(getAllLecturers.pending, state => {
            state.isLoading = true
        })
        .addCase(getAllLecturers.fulfilled, (state, action) => {
            state.isLoading = false
            state.lecturers = action.payload
        })
        .addCase(getAllLecturers.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })


    }
})

export default usersSilce.reducer