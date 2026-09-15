import { createAsyncThunk } from "@reduxjs/toolkit"
import { api } from "@/api/axios"
import { masterError } from "@/components/master-data/master-api"
import type { StudentFinance } from "@/types/student-finance"
// The endpoint expects User.id, matching the student detail page identifier.
export const getStudentFinance = createAsyncThunk<StudentFinance, string, { rejectValue: string }>("studentFinance/fetch", async (id, { signal, rejectWithValue }) => {
  try { return (await api.get<{ data: StudentFinance }>(`/students/${encodeURIComponent(id)}/keuangan`, { signal })).data.data }
  catch (error) { return rejectWithValue(masterError(error)) }
})
