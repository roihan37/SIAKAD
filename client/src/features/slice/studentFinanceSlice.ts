import { createSlice } from "@reduxjs/toolkit"
import type { StudentFinance } from "@/types/student-finance"
import { getStudentFinance } from "../action/studentFinanceThunk"
import { logout } from "./authSlice"
import { logoutApi, refreshToken } from "../action/authThunk"
interface FinanceState { data: StudentFinance | null; studentId: string | null; loading: boolean; error: string | null; requestId: string | null }
const initialState: FinanceState = { data: null, studentId: null, loading: false, error: null, requestId: null }
const slice = createSlice({
  name: "studentFinance", initialState,
  reducers: { clearStudentFinance: () => initialState },
  extraReducers: builder => {
    builder.addCase(getStudentFinance.pending, (state, action) => { state.data = null; state.studentId = action.meta.arg; state.loading = true; state.error = null; state.requestId = action.meta.requestId })
      .addCase(getStudentFinance.fulfilled, (state, action) => { if (state.requestId !== action.meta.requestId) return; state.data = action.payload; state.loading = false; state.requestId = null })
      .addCase(getStudentFinance.rejected, (state, action) => { if (state.requestId !== action.meta.requestId) return; state.loading = false; state.requestId = null; state.error = action.meta.aborted ? null : action.payload ?? "Keuangan mahasiswa gagal dimuat." })
      .addCase(logout, () => initialState).addCase(logoutApi.fulfilled, () => initialState).addCase(refreshToken.rejected, () => initialState)
  },
})
export const { clearStudentFinance } = slice.actions
export default slice.reducer
