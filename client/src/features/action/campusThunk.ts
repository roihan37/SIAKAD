import { api } from "@/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllFakultas = createAsyncThunk(
    "fakultas",
    async (_, thunkAPI) => {
      try {
        const response = await api.get("/fakultas")
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
    async (_, thunkAPI) => {
      try {
        const response = await api.get("/prodi")
        return response.data;
        
      } catch (err: any) {
       
        return thunkAPI.rejectWithValue(
          err.response.data.message
        );
      }
    }
  );