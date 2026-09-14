import { createAsyncThunk } from "@reduxjs/toolkit"
import { api } from "@/api/axios"
import { getDashboardYears } from "@/api/dashboard"
import { masterApi, masterError } from "@/components/master-data/master-api"
import type { BillList, BillOptions, BillQuery, GenerateBills } from "@/types/tuition"

export const getTuitionBills = createAsyncThunk<BillList, BillQuery, { rejectValue: string }>("tuition/list", async (params, { signal, rejectWithValue }) => {
  try { return (await api.get<{ data: BillList }>("/admin/ukt/bills", { params, signal })).data.data }
  catch (error) { return rejectWithValue(masterError(error)) }
})
export const generateTuitionBills = createAsyncThunk<{ generated: number; skipped: number }, GenerateBills, { rejectValue: string }>("tuition/generate", async (payload, { rejectWithValue }) => {
  try { return (await api.post<{ data: { generated: number; skipped: number } }>("/admin/ukt/bills/generate", payload)).data.data }
  catch (error) { return rejectWithValue(masterError(error)) }
})
export const getTuitionOptions = createAsyncThunk<BillOptions, void, { rejectValue: string }>("tuition/options", async (_, { signal, rejectWithValue }) => {
  try {
    const [years, programs] = await Promise.all([getDashboardYears(signal), masterApi.options("prodi", signal)])
    return { years: years.map(year => ({ id: String(year.id), label: `${year.tahun} ${year.semester}` })), programs: programs.map(program => ({ id: String(program.id), label: program.name })) }
  } catch (error) { return rejectWithValue(masterError(error)) }
})
