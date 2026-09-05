import { api } from "@/api/axios";
import type { CreateLecturerPayload, CreateStudentPayload, PaginationParams } from "@/types/param";
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
        err.response.data.message
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
      return thunkAPI.rejectWithValue(err.response.data.message)
    }
  }
)

export const updateStudent = createAsyncThunk(
  "students/update",
  async ({ id, payload }: { id: string; payload: Record<string, unknown> }, thunkAPI) => {
    try {
      const response = await api.patch(`/students/${id}`, payload)
      return response.data
    } catch (err: any) {
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
      return thunkAPI.rejectWithValue(err.response.data.message)
    }
  }
)

export const getStudentKRS = createAsyncThunk(
  "students/getKRS",
  async ({ id, tahunAkademikId }: { id: string; tahunAkademikId: number }, thunkAPI) => {
    try {
      const response = await api.get(`/students/${id}/krs`, { params: { tahunAkademikId } })
      return response.data
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response.data.message)
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
      return thunkAPI.rejectWithValue(err.response.data.message)
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