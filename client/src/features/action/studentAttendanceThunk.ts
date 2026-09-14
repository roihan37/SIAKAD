import { createAsyncThunk } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import { api } from "@/api/axios"
import type { StudentAttendance, StudentAttendanceQuery } from "@/types/student-attendance"
export const getStudentAttendance = createAsyncThunk<StudentAttendance, StudentAttendanceQuery, { rejectValue: string }>(
  "studentAttendance/fetch",
  async ({ id, tahunAkademikId }, { signal, rejectWithValue }) => {
    try {
      const { data } = await api.get<{ data: StudentAttendance }>(`/students/${encodeURIComponent(id)}/presensi`, { params: { tahunAkademikId }, signal })
      return data.data
    } catch (error) {
      return rejectWithValue(isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? "Tidak dapat menghubungi server. Silakan coba lagi." : "Presensi mahasiswa gagal dimuat.")
    }
  },
)
