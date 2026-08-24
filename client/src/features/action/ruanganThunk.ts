import { api } from "@/api/axios";
import type { Ruangan } from "@/types/campus";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllRuangan = createAsyncThunk(
  "ruangan/getAll",
  async (
    params: Partial<PaginationParams> | undefined,
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
      const response = await api.get("/ruangan", {
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

export const createRuangan = createAsyncThunk(
  "ruangan/create",
  async (payload: Ruangan, thunkAPI) => {
    try {
      const response = await api.post("/ruangan", payload);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat mata kuliah");
    }
  }
);
