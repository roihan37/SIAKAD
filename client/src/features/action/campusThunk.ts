import { api } from "@/api/axios";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

interface FakultasQuery {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const getAllFakultas = createAsyncThunk(
  "fakultas",
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
      const response = await api.get("/fakultas", {
        params: {
          page,
          limit,
          search,
          sortBy,
          sortOrder,
        },
      });

      return response.data;

    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message ?? "Terjadi kesalahan"
      );
    }
  }
);

  export const getAllProdi = createAsyncThunk(
    "prodi",
    async ({ 
      page, 
      limit, 
      search, 
      sortBy, 
      sortOrder, 
      fakultasId
     }: PaginationParams
      , thunkAPI) => {
      try {
        const response = await api.get("/prodi",{
          params : {
            page,
            limit,
            search,
            sortBy, 
            sortOrder,
            fakultasId
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