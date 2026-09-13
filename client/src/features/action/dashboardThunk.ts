import { createAsyncThunk } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import { getDashboard, getDashboardYears } from "@/api/dashboard"
import type { AcademicYearOption, DashboardData } from "@/types/dashboard"

const errorMessage = (error: unknown) => isAxiosError<{ message?: string }>(error)
  ? error.response?.data?.message ?? "Tidak dapat menghubungi server. Silakan coba lagi."
  : "Data dashboard gagal dimuat. Silakan coba lagi."

export const fetchDashboard = createAsyncThunk<DashboardData, number | undefined, { rejectValue: string }>(
  "dashboard/fetch",
  async (yearId, { signal, rejectWithValue }) => {
    try { return await getDashboard(yearId, signal) }
    catch (error) { return rejectWithValue(errorMessage(error)) }
  },
)

export const fetchDashboardYears = createAsyncThunk<AcademicYearOption[], void, { rejectValue: string }>(
  "dashboard/fetchYears",
  async (_, { signal, rejectWithValue }) => {
    try { return await getDashboardYears(signal) }
    catch (error) { return rejectWithValue(errorMessage(error)) }
  },
)
