import type { CampusState } from "@/types/state";
import { createSlice } from "@reduxjs/toolkit";
import { getAllFakultas, getAllProdi } from "../action/campusThunk";

const initialState : CampusState ={
    isLoading : false,
    error : null,
    fakultas : [],
    prodi : []
}
const campusSilce = createSlice({
    name : 'campus',
    initialState,
    reducers : {

    },
    extraReducers(builder) {
        builder

        // FAKULTAS
        .addCase(getAllFakultas.pending, state => {
            state.isLoading = true
        })
        .addCase(getAllFakultas.fulfilled, (state, action) => {
            state.isLoading = false
            state.fakultas = action.payload
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
        })
        .addCase(getAllProdi.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })


    }
})

export default campusSilce.reducer