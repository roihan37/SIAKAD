import { api } from "@/api/axios";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllFakultas = createAsyncThunk(
    "fakultas",
    async ({ page, limit, search, sortBy, sortOrder }: PaginationParams
      , thunkAPI) => {
      try {
        const response = await api.get("/fakultas",{
          params : {
            page,
            limit,
            search,
            sortBy, 
            sortOrder
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

  export const getAllProdi = createAsyncThunk(
    "prodi",
    async ({ page, limit, search, sortBy, sortOrder }: PaginationParams
      , thunkAPI) => {
      try {
        const response = await api.get("/prodi",{
          params : {
            page,
            limit,
            search,
            sortBy, 
            sortOrder
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