import { api } from "@/api/axios";
import type { Jadwal } from "@/types/campus";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllJadwal = createAsyncThunk(
  "jadwal/getAll",
  async (
    params: Partial<PaginationParams> | undefined,
    thunkAPI
  ) => {

    const {
      page = 1,
      limit = 10,
      search = "",
      sortBy = "hari",
      sortOrder = "asc",
      prodiId,
      tahunAkademikId,
    } = params ?? {};

    try {
      const response = await api.get("/jadwal", {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
          prodiId,
          tahunAkademikId
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

export const createJadwal = createAsyncThunk(
  "jadwal/create",
  async (payload: Jadwal, thunkAPI) => {
    try {
      const response = await api.post("/ruangan", payload);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat Jadwal");
    }
  }
);
