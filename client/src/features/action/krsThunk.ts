import { api } from "@/api/axios";
import type { Jadwal } from "@/types/campus";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllKRS = createAsyncThunk(
  "krs/getAll",
  async (
    params: Partial<PaginationParams> | undefined,
    thunkAPI
  ) => {

    // const {
    //   page = 1,
    //   limit = 10,
    //   search = "",
    //   sortOrder = "asc",
    // } = params ?? {};

    try {
      const response = await api.get("/krs", {
        params});
      return response.data;

    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message ?? "Terjadi kesalahan"
      );
    }
  }
);

export const createKRS = createAsyncThunk(
  "krs/create",
  async (payload: Jadwal, thunkAPI) => {
    try {
      const response = await api.post("/krs", payload);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat Jadwal");
    }
  }
);
