import { api } from "@/api/axios";
import type { PaginationParams } from "@/types/param";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const getAllStudents = createAsyncThunk(
    "students",
    async (
      { page, limit, search, sortBy, sortOrder }: PaginationParams,
      thunkAPI
    ) => {
      
      try {
        const response = await api.get("/students",{
          params : {
            page,
            limit,
            search,
            sortBy, 
            sortOrder
          }
        })
        // console.log(response.data, "NN");
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
    async ({ page, limit, search, sortBy, sortOrder, prodiId }: PaginationParams, 
      thunkAPI) => {
      try {
        const response = await api.get("/lecturers",{
          params : {
            page,
            limit,
            search,
            sortBy, 
            sortOrder,
            prodiId
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