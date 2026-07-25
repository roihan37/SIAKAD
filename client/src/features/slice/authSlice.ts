import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import { login } from "../action/authThunk"


interface AuthState {
    isLoading : boolean,
    error: string | null;
}

const initialState : AuthState = {
    isLoading : false,
    error : null
}

const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers : {

    },
    extraReducers(builder) {
        builder

        .addCase(login.pending, state => {
            state.isLoading = true
        })
        .addCase(login.fulfilled, (state, action) => {
            state.isLoading = false
            localStorage.setItem("access_token", action.payload.access_token)
        })
        .addCase(login.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })
    }
})

export default authSlice.reducer





