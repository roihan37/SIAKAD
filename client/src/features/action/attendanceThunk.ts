import { createAsyncThunk } from "@reduxjs/toolkit"
import { isAxiosError } from "axios"
import { getAttendance, getAttendanceOptions } from "@/api/attendance"
import type { AttendanceOptions, AttendanceQuery, AttendanceSummary, StudentAttendancePage, MeetingAttendancePage, MeetingAttendanceDetail } from "@/types/attendance"
const message = (error: unknown) => isAxiosError<{ message?: string }>(error) ? error.response?.data?.message ?? "Tidak dapat menghubungi server." : "Data presensi gagal dimuat."
function resource<T>(name: string) {
  return createAsyncThunk<T, AttendanceQuery, { rejectValue: string }>(`attendance/${name}`, async (query, { signal, rejectWithValue }) => {
    try { return await getAttendance<T>(name, query, signal) } catch (error) { return rejectWithValue(message(error)) }
  })
}
export const fetchAttendanceSummary = resource<AttendanceSummary>("summary")
export const fetchAttendanceStudents = resource<StudentAttendancePage>("students")
export const fetchAttendanceMeetings = resource<MeetingAttendancePage>("meetings")
export const fetchAttendanceFilters = createAsyncThunk<AttendanceOptions, void, { rejectValue: string }>("attendance/filters", async (_, { signal, rejectWithValue }) => {
  try { return await getAttendanceOptions(signal) } catch (error) { return rejectWithValue(message(error)) }
})
export const fetchAttendanceDetail = createAsyncThunk<MeetingAttendanceDetail, string, { rejectValue: string }>("attendance/detail", async (id, { signal, rejectWithValue }) => {
  try { return await getAttendance<MeetingAttendanceDetail>(`meetings/${encodeURIComponent(id)}`, {}, signal) } catch (error) { return rejectWithValue(message(error)) }
})
