import { createSlice } from "@reduxjs/toolkit"
import { login, logoutApi, refreshToken, changePassword } from "../action/authThunk"
import { logout, sessionReceived, passwordChangeRequired } from "../auth-session"
import type { AuthFailure, AuthSession } from "@/types/auth"
export interface AuthState {
  user: AuthSession["user"] | null
  accessToken: string | null
  initialized: boolean
  isLoading: boolean
  loggingOut: boolean
  changingPassword: boolean
  error: AuthFailure | null
  recoveryError: AuthFailure | null
  passwordError: AuthFailure | null
  logoutError: AuthFailure | null
  loginRequestId: string | null
  refreshRequestId: string | null
}
const initialState: AuthState = { user: null, accessToken: null, initialized: false, isLoading: false, loggingOut: false, changingPassword: false, error: null, recoveryError: null, passwordError: null, logoutError: null, loginRequestId: null, refreshRequestId: null }
const fallback = { message: "Autentikasi gagal. Silakan coba lagi." }
const slice = createSlice({
  name: "auth", initialState, reducers: {},
  extraReducers: builder => builder
    .addCase(sessionReceived, (state, action) => { state.accessToken = action.payload.accessToken; state.user = action.payload.user; state.initialized = true; state.recoveryError = null; state.error = null })
    .addCase(passwordChangeRequired, state => { if (state.user) state.user.mustChangePassword = true })
    .addCase(logout, state => ({ ...initialState, initialized: true, loggingOut: state.loggingOut }))
    .addCase(login.pending, (state, action) => { state.isLoading = true; state.error = null; state.loginRequestId = action.meta.requestId })
    .addCase(login.fulfilled, (state, action) => { if (state.loginRequestId !== action.meta.requestId) return; state.isLoading = false; state.loginRequestId = null; state.logoutError = null })
    .addCase(login.rejected, (state, action) => { if (state.loginRequestId !== action.meta.requestId) return; state.isLoading = false; state.loginRequestId = null; state.error = action.payload ?? fallback })
    .addCase(refreshToken.pending, (state, action) => { state.refreshRequestId = action.meta.requestId; state.recoveryError = null })
    .addCase(refreshToken.fulfilled, (state, action) => { if (state.refreshRequestId === action.meta.requestId) state.refreshRequestId = null })
    .addCase(refreshToken.rejected, (state, action) => {
      if (state.refreshRequestId !== action.meta.requestId) return
      state.refreshRequestId = null
      if (action.payload?.code !== "SESSION_CHANGED") state.recoveryError = action.payload ?? fallback
    })
    .addCase(logoutApi.pending, state => { state.loggingOut = true; state.logoutError = null })
    .addCase(logoutApi.fulfilled, state => { state.loggingOut = false; state.logoutError = null })
    .addCase(logoutApi.rejected, (state, action) => { state.loggingOut = false; state.logoutError = action.payload ?? fallback })
    .addCase(changePassword.pending, state => { state.changingPassword = true; state.passwordError = null })
    .addCase(changePassword.fulfilled, state => { state.changingPassword = false })
    .addCase(changePassword.rejected, (state, action) => { state.changingPassword = false; state.passwordError = action.payload ?? fallback }),
})
export { logout, sessionReceived, passwordChangeRequired }
export default slice.reducer
