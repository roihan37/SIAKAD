import { isAxiosError } from "axios";
import { api } from "@/api/axios";
import type { CreateStudentPayload, PaginationParams, UpdateStudentPayload } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllStudents = createAsyncThunk(
  "students/getAll",
  async (
    { page, limit, search, sortBy, sortOrder }: PaginationParams,
    thunkAPI
  ) => {

    try {
      const response = await api.get("/students", {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder
        }
      })
      // console.log(response.data, "NN");
      return response.data;


    } catch (err: any) {

      return thunkAPI.rejectWithValue(
        err.response?.data?.message ?? "Gagal memuat data mahasiswa. Silakan coba lagi."
      );
    }
  }
);

export const getStudentById = createAsyncThunk(
  "students/getId",
  async (id: string, thunkAPI) => {
    try {
      const response = await api.get(`/students/${id}`)
      return response.data
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal memuat data mahasiswa. Silakan coba lagi.")
    }
  }
)

export const updateStudent = createAsyncThunk(
  "students/update",
  async ({ id, payload }: { id: string; payload: UpdateStudentPayload }, thunkAPI) => {
    try {
      // console.log(id, payload, "ID & PAYLOAD");
      const response = await api.patch(`/students/${id}`, payload)
      return response.data
    } catch (err: any) {
      console.log(err, "<<<<")
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal memperbarui mahasiswa")
    }
  }
)

export const getStudentHistorySemester = createAsyncThunk(
  "students/getHistorySemester",
  async (id: string, thunkAPI) => {
    try {
      console.log(id, "IDDD");
      const response = await api.get(`/students/${id}/history-semester`)
      return response.data
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal memuat data mahasiswa. Silakan coba lagi.")
    }
  }
)

export const getStudentKRS = createAsyncThunk(
  "students/getKRS",
  async ({ id, tahunAkademikId }: { id: string; tahunAkademikId: number }, thunkAPI) => {
    try {

      console.log(tahunAkademikId, "TAHUN AKADEMIK ID");
      
      const response = await api.get(`/students/${id}/krs`, { params: { tahunAkademikId } })
      return response.data
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal memuat data mahasiswa. Silakan coba lagi.")
    }
  }
)

export const getStudentNilai = createAsyncThunk(
  "students/getNilai",
  async ({ id, tahunAkademikId }: { id: string; tahunAkademikId: number }, thunkAPI) => {
    try {
      const response = await api.get(`/students/${id}/nilai`, { params: { tahunAkademikId } })
      return response.data
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal memuat data mahasiswa. Silakan coba lagi.")
    }
  }
)

export const createStudent = createAsyncThunk(
  "students/create",
  async (payload: CreateStudentPayload, thunkAPI) => {
    try {
      const response = await api.post("/students", payload)
      // console.log(response.data);
      return response.data

    } catch (err: any) {
      const message =
        err.response?.data?.message ??
        "Gagal membuat mahasiswa"
      return thunkAPI.rejectWithValue(
        message
      )
    }
  }
)

export const getAvatarUploadUrl = createAsyncThunk(
  "students/avatarUploadUrl",
  async (contentType: string, thunkAPI) => {
    try {
      const response = await api.post("/avatars/students/upload-url", { contentType })
      return response.data as { uploadUrl: string; key: string }
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message ?? "Gagal menyiapkan upload foto"
      )
    }
  }
)

export const getStudentAvatarUploadUrl = createAsyncThunk(
  "students/studentAvatarUploadUrl",
  async ({ id, contentType }: { id: string; contentType: string }, thunkAPI) => {
    try {
      const response = await api.post(`/avatars/students/${id}/upload-url`, { contentType })
      return response.data as { uploadUrl: string; key: string }
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal menyiapkan upload foto")
    }
  }
)
export const resetStudentPassword = createAsyncThunk<
  void,
  { userId: string; password: string },
  { rejectValue: string }
>(
  "students/resetPassword",
  async ({ userId, password }, { rejectWithValue }) => {
    try {
      await api.patch(`/students/${encodeURIComponent(userId)}/reset-password`, { password })
    } catch (error) {
      return rejectWithValue(
        isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message ?? "Gagal mereset password mahasiswa"
          : "Gagal mereset password mahasiswa"
      )
    }
  }
)

export const deleteStudent = createAsyncThunk<string, string, { rejectValue: string }>(
  "students/delete",
  async (userId, { rejectWithValue }) => {
    try {
      await api.delete(`/students/${encodeURIComponent(userId)}`)
      return userId
    } catch (error) {
      return rejectWithValue(
        isAxiosError<{ message?: string }>(error)
          ? error.response?.data?.message ?? "Gagal menghapus mahasiswa"
          : "Gagal menghapus mahasiswa"
      )
    }
  }
)

export type BulkStudentAction = { ids: string[] } & (
  { kind: "delete" } | { kind: "status"; status: "Aktif" | "Cuti" | "Lulus" | "Nonaktif"; statusReason: string }
)

export const bulkMutateStudents = createAsyncThunk<
  { ids: string[]; message: string }, BulkStudentAction, { rejectValue: string }
>("students/update/bulk", async (input, { rejectWithValue }) => {
  try {
    const response = input.kind === "delete"
      ? await api.delete("/students/bulk", { data: { ids: input.ids } })
      : await api.patch("/students/bulk/status", { ids: input.ids, status: input.status, statusReason: input.statusReason })
    return { ids: input.ids, message: response.data.message }
  } catch (error) {
    return rejectWithValue(isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message ?? "Aksi massal gagal. Silakan coba lagi."
      : "Aksi massal gagal. Silakan coba lagi.")
  }
})
