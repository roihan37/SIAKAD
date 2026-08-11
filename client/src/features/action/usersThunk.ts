import { api } from "@/api/axios";
import type { CreateStudentPayload, PaginationParams } from "@/types/param";
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

export const createStudent = createAsyncThunk(
    "students/create",
    async (payload: CreateStudentPayload, thunkAPI) => {
        try {
            const response = await api.post("/students", payload)
            console.log(response.data);
            return response.data
            
        } catch (err: any) {
          console.log(err);
          
            return thunkAPI.rejectWithValue(
                err.response?.data?.message ?? "Gagal membuat mahasiswa"
            )
        }
    }
)

export const getAvatarUploadUrl = createAsyncThunk(
    "students/avatarUploadUrl",
    async (contentType: string, thunkAPI) => {
        try {
            const response = await api.post("/students/avatar/upload-url", { contentType })
            return response.data as { uploadUrl: string; key: string }
        } catch (err: any) {
            return thunkAPI.rejectWithValue(
                err.response?.data?.message ?? "Gagal menyiapkan upload foto"
            )
        }
    }
)