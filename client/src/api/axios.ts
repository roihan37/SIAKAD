import { logout, setAccessToken } from "@/features/slice/authSlice";
import axios from "axios";
let appStore: typeof import("@/app/store").store;

export const injectStore = (store: typeof appStore) => {
  appStore = store;
};


export const api = axios.create({
  baseURL: "http://localhost:4000/api/v1/",
  withCredentials: true
});


api.interceptors.request.use((config) => {

  // console.log(config, "ISI CONFIG");
  
  const token = appStore.getState().auth.accessToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
  (response) => response,
  
  
  async (err) => {
    const originalRequest = err.config;

    if (
      err.response?.status === 401 &&
      err.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const { data } = await api.post("/auth/refresh");
        console.log(data, 'MMM');
        
        appStore.dispatch(setAccessToken(data.access_token));
        
        originalRequest.headers.Authorization =
          `Bearer ${data.access_token}`;

        return api(originalRequest);

      } catch (refreshError) {
        
        
        appStore.dispatch(logout());

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(err);
  }
);
