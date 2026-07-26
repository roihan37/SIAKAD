import { createSlice } from "@reduxjs/toolkit"
import { login } from "../action/authThunk"
import type { AuthState } from "@/types/state"


const initialState : AuthState = {
    isLoading : false,
    error : null,
    accessToken : null
}

const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers : {
        logout(state){
            state.accessToken = null
        }
    },
    extraReducers(builder) {
        builder
        .addCase(login.pending, state => {
            state.isLoading = true
        })
        .addCase(login.fulfilled, (state, action) => {
            state.isLoading = false
            state.accessToken = action.payload.access_token
        })
        .addCase(login.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })
    }
})

export default authSlice.reducer





