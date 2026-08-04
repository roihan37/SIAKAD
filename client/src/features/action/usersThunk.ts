import { api } from "@/api/axios";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllStudents = createAsyncThunk(
    "students",
    async (
      { page, limit }: PaginationParams,
      thunkAPI
    ) => {
      
      try {
        const response = await api.get("/students",{
          params : {
            page,
            limit
          }
        })
        console.log(response.data, "NN");
        return response.data;
        
        
      } catch (err: any) {
       
        return thunkAPI.rejectWithValue(
          err.response.data.message
        );
      }
    }
  );

  export const getAllLecturers = createAsyncThunk(
    "lecturers",
    async (_, thunkAPI) => {
      try {
        const response = await api.get("/lecturers")
        return response.data;
        
      } catch (err: any) {
       
        return thunkAPI.rejectWithValue(
          err.response.data.message
        );
      }
    }
  );