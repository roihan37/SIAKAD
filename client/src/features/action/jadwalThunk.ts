import { api } from "@/api/axios";
import { isAxiosError } from "axios";
export type CreateJadwalPayload = { kelasMataKuliahId: number; tahunAkademikId: number; ruanganId: number; hari: string; jamMulai: string; jamSelesai: string };
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

    } catch (err) {
      return thunkAPI.rejectWithValue(
        isAxiosError<{ message?: string }>(err) ? err.response?.data?.message ?? "Gagal memuat jadwal" : "Gagal memuat jadwal"
      );
    }
  }
);

export const createJadwal = createAsyncThunk(
  "jadwal/create",
  async (payload: CreateJadwalPayload, thunkAPI) => {
    try {
      const response = await api.post("/jadwal", payload);
      return response.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(isAxiosError<{ message?: string }>(err) ? err.response?.data?.message ?? "Gagal membuat jadwal" : "Gagal membuat jadwal");
    }
  }
);
