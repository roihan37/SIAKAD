import { api } from "@/api/axios";
import type { CreateMatkulPayload, PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllMatkul = createAsyncThunk(
  "matkul/getAll",
  async (
    params: Partial<PaginationParams> | undefined,
    thunkAPI
  ) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "name",
      sortOrder = "desc",
    } = params ?? {};

    try {
      const response = await api.get("/mata-kuliah", {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
        },
      });
      // console.log("response.data", response.data);
      return response.data;

    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message ?? "Terjadi kesalahan"
      );
    }
  }
);

export const createMatkul = createAsyncThunk(
  "matkul/create",
  async (payload: CreateMatkulPayload, thunkAPI) => {
    console.log(payload);
    
    try {
      const response = await api.post("/mata-kuliah", payload);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat mata kuliah");
    }
  }
);
