import { api } from "@/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllStudents = createAsyncThunk(
    "users",
    async (_, thunkAPI) => {
      
      
      try {
        const response = await api.get("/students")
        return response.data;
        
      } catch (err: any) {
       
        return thunkAPI.rejectWithValue(
          err.response.data.message
        );
      }
    }
  );