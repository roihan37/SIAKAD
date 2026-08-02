import type { UsersState } from "@/types/state";
import { createSlice } from "@reduxjs/toolkit";
import { getAllStudents } from "../action/usersThunk";

const initialState : UsersState ={
    isLoading : false,
    error : null,
    students : null,
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
        })
        .addCase(getAllStudents.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })


    }
})

export default usersSilce.reducer