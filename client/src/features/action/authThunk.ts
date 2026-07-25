import { api } from "@/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export interface LoginRequest {
    email: string;
    password: string;
  }
  

export const login = createAsyncThunk(
  "auth/login",
  async (data: LoginRequest, thunkAPI) => {
    try {
      const response = await api.post("/auth/login", {
        email : data.email,
        password : data.password,
      });
      
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }
);