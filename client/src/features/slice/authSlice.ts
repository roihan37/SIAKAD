import { createSlice } from "@reduxjs/toolkit"
import { login, refreshToken } from "../action/authThunk"
import type { AuthState } from "@/types/state"


const initialState : AuthState = {
    isLoading : false,
    error : null,
    accessToken : null,
    initialized: false,
}

const authSlice = createSlice({
    name : 'auth',
    initialState,
    reducers : {
        logout(state){
            state.accessToken = null
            console.log("LOGOUT DIPANGGIL");
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
        })
        .addCase(login.rejected, (state, action) =>{
            state.isLoading = false
            state.error = action.payload as string;
        })
        .addCase(refreshToken.fulfilled, (state, action)=>{
            state.accessToken = action.payload.accessToken
            state.initialized = true;
        })
        .addCase(refreshToken.rejected, (state, action)=>{
            state.accessToken = null
            state.initialized = true;
            state.error = action.payload as string;
        })
    }
})

export const { logout, setAccessToken } = authSlice.actions;

export default authSlice.reducer





