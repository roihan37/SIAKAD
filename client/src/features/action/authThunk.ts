import { api } from "@/api/axios";
import { createAsyncThunk } from "@reduxjs/toolkit";


export interface LoginRequest {
    identifier: string;
    password: string;
  }
  

export const login = createAsyncThunk(
  "auth/login",
  async (data: LoginRequest, thunkAPI) => {
    
    
    try {
      const response = await api.post("/auth/login", {
        identifier : data.identifier,
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

export const refreshToken = createAsyncThunk(
  "auth/refresh",
  async (_, thunkAPI) => {
    try {
      const response = await api.post("/auth/refreshTokens")
      return response.data;
      
    } catch (err: any) {
    
      return thunkAPI.rejectWithValue(
        err.response.data.message
      );
    }
  }
)