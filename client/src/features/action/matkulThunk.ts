import { api } from "@/api/axios";
import type { CreateMatkulPayload } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

interface FakultasQuery {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const getAllMatkul = createAsyncThunk(
  "matkul",
  async (
    params: Partial<FakultasQuery> | undefined,
    thunkAPI
  ) => {

    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "name",
      sortOrder = "asc",
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
    try {
      const response = await api.post("/mata-kuliah", payload);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat mata kuliah");
    }
  }
);
