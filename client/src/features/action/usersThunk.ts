import { api } from "@/api/axios";
import type { CreateLecturerPayload, CreateStudentPayload, PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllStudents = createAsyncThunk(
  "students",
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

export const getAllLecturers = createAsyncThunk(
  "lecturers",
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
      console.log(response.data, "NN");
      return response.data;

    } catch (err: any) {

      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }


);

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
      console.log(
        "ERROR BE:",
        err.response?.data
      )
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
