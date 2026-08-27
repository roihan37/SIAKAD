import { api } from "@/api/axios";
import type { TahunAkademik } from "@/types/campus";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllTAkademik= createAsyncThunk(
  "tAkademik/getAll",
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
      const response = await api.get("/tahun-akademik", {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
        },
      });
      console.log("response.data", response.data);
      return response.data;

    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message ?? "Terjadi kesalahan"
      );
    }
  }
);

export const createTAkademik = createAsyncThunk(
  "tAkademik/create",
  async (payload: TahunAkademik, thunkAPI) => {
    try {
      
      
      const response = await api.post("/tahun-akademik", payload);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat mata kuliah");
    }
  }
);
