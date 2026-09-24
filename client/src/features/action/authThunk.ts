import { api, endSession, refreshSession, loginSession, finishPasswordChange } from "@/api/axios"
import { createAsyncThunk } from "@reduxjs/toolkit"
import { authFailure } from "@/api/auth-errors"
import type { AuthFailure, AuthSession, LoginRequest, PasswordRequest } from "@/types/auth"
export type { LoginRequest } from "@/types/auth"
export const login = createAsyncThunk<AuthSession, LoginRequest, { rejectValue: AuthFailure }>("auth/login", async (body, { rejectWithValue }) => {
  try { return await loginSession(body) } catch (error) { return rejectWithValue(authFailure(error)) }
})
export const refreshToken = createAsyncThunk<AuthSession, void, { rejectValue: AuthFailure }>("auth/refresh", async (_, { rejectWithValue }) => {
  try { return await refreshSession() } catch (error) { return rejectWithValue(authFailure(error)) }
})
export const logoutApi = createAsyncThunk<void, void, { rejectValue: AuthFailure }>("auth/logout", async (_, { rejectWithValue }) => {
  try { await endSession() } catch (error) { return rejectWithValue(authFailure(error)) }
})
export const changePassword = createAsyncThunk<void, PasswordRequest, { rejectValue: AuthFailure }>("auth/changePassword", async (body, { rejectWithValue }) => {
  try { await api.post("/auth/change-password", body); finishPasswordChange() }
  catch (error) { return rejectWithValue(authFailure(error)) }
})
