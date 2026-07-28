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
        },
        setAccessToken(state, action) {
            state.accessToken = action.payload;
        }
    },
    extraReducers(builder) {
        builder
        .addCase(login.pending, state => {
            state.isLoading = true
        })
        .addCase(login.fulfilled, (state, action) => {
            state.isLoading = false
            state.accessToken = action.payload.accessToken
            console.log(action.payload.accessToken, "<< data case");
        })
        .addCase(login.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })
    }
})

export const { logout, setAccessToken } = authSlice.actions;

export default authSlice.reducer





