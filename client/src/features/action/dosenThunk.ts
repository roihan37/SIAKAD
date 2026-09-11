import { uploadLecturerAvatar } from "@/api/lecturer-avatar";
import type { UpdateLecturerPayload } from "@/schemas/dosen-edit.schema";
import { isAxiosError } from "axios";
import type { LecturerDetailResponse } from "@/types/lecturer-detail";
import { api } from "@/api/axios";
import type { CreateLecturerPayload, PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";


export const getAllLecturers = createAsyncThunk(
  "lecturers/getAll",
  async ({ page, limit, search, sortBy, sortOrder, prodiId }: PaginationParams,
    thunkAPI) => {
    try {
      const response = await api.get("/lecturers", {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          prodiId
        }
      })
      return response.data;

    } catch (err: any) {

      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }


);

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

export const createLecturer = createAsyncThunk(
  "lecturers/create",
  async (payload: CreateLecturerPayload, thunkAPI) => {
    try {
      const response = await api.post("/lecturers", payload)
      return response.data
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat dosen")
    }
  }
)

export const getLecturerAvatarUploadUrl = createAsyncThunk(
  "lecturers/avatarUploadUrl",
  async (contentType: string, thunkAPI) => {
    try {
      const response = await api.post("/avatars/lecturers/upload-url", { contentType })
      return response.data as { uploadUrl: string; key: string }
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal menyiapkan upload foto")
    }
  }
)

export const getLecturerById = createAsyncThunk<
  LecturerDetailResponse, string, { rejectValue: string }
>("lecturers/getById", async (id, { rejectWithValue, signal }) => {
  try {
    const response = await api.get<LecturerDetailResponse>(`/lecturers/${encodeURIComponent(id)}`, { signal })
    return response.data
  } catch (error) {
    return rejectWithValue(isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message ?? "Gagal memuat detail dosen. Silakan coba lagi."
      : "Gagal memuat detail dosen. Silakan coba lagi.")
  }
})

export const updateLecturer = createAsyncThunk<
  { id: string }, { id: string; payload: UpdateLecturerPayload; photo?: string | null }, { rejectValue: string }
>("lecturers/update", async ({ id, payload, photo }, { rejectWithValue }) => {
  try {
    const avatarKey = photo ? await uploadLecturerAvatar(id, photo) : undefined
    await api.patch(`/lecturers/${encodeURIComponent(id)}`, { ...payload, ...(avatarKey ? { avatarKey } : {}) })
    return { id }
  } catch (error) {
    return rejectWithValue(isAxiosError<{ message?: string }>(error)
      ? error.response?.data?.message ?? "Gagal memperbarui dosen."
      : error instanceof Error ? error.message : "Gagal memperbarui dosen.")
  }
})
