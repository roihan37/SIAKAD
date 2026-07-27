import axios from "axios";
import { store } from "@/app/store";


export const api = axios.create({
  baseURL: "http://localhost:4000/",
  withCredentials: true
});


api.interceptors.request.use((config) => {

    const token = store.getState().users.accessToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});