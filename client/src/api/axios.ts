import axios from "axios";
let appStore: typeof import("@/app/store").store;

export const injectStore = (store: typeof appStore) => {
  appStore = store;
};


export const api = axios.create({
  baseURL: "http://localhost:4000/",
  withCredentials: true
});


api.interceptors.request.use((config) => {

  const token = appStore.getState().users.accessToken;

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
  (res) => res,

 async (err) => {
  // request yang tadi gagal
  const originalRequest = err.config;
  // setAccessToken
  if(err.response.status === 401){

  }
  
 }
)


// Response Interceptor
// api.interceptors.response.use(
//   (response) => response,

//   async (error) => {
//     // request yang tadi gagal
//     const originalRequest = error.config;

//     // jika access token expired
//     if (error.response?.status === 401) {
//       try {
//         // meminta access token baru
//         const response = await api.post("/auth/refresh");

//         console.log("Refresh berhasil");
//         console.log(response.data);

//         // simpan access token baru ke redux
//         store.dispatch(
//           setAccessToken(response.data.accessToken)
//         );

//         // ulangi request yang tadi gagal
//         return api(originalRequest);

//       } catch (err) {

//         // refresh token juga gagal
//         store.dispatch(logout());

//         return Promise.reject(err);
//       }
//     }

//     return Promise.reject(error);
//   }
// );