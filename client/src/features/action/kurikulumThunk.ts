import { api } from "@/api/axios";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllKurikulum= createAsyncThunk(
  "kurikulum/getAll",
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
      const response = await api.get("/kurikulum", {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
        },
      });

      console.log(response.data);
      
      return response.data;

    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message ?? "Terjadi kesalahan"
      );
    }
  }
);

// export const createTAkademik = createAsyncThunk(
//   "kurikulum/create",
//   async (payload: TahunAkademik, thunkAPI) => {
//     try {
//       console.log(payload);
      
//       const response = await api.post("/kurikulum", payload);
//       return response.data;
//     } catch (err: any) {
//       return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat mata kuliah");
//     }
//   }
// );
