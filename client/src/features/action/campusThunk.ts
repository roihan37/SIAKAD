import { api } from "@/api/axios";
import type { CreateFakultasPayload, CreateProdiPayload, PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";


export const getAllFakultas = createAsyncThunk(
  "fakultas",
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

export const createFakultas = createAsyncThunk(
  "fakultas/create",
  async (payload: CreateFakultasPayload, thunkAPI) => {
    try {
      const response = await api.post("/fakultas", payload);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat fakultas");
    }
  }
);

export const createProdi = createAsyncThunk(
  "prodi/create",
  async (payload: CreateProdiPayload, thunkAPI) => {
    try {
      const response = await api.post("/prodi", payload);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message ?? "Gagal membuat program studi");
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
