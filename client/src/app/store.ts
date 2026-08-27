import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/slice/authSlice'
import usersReducer from '@/features/slice/usersSlice'
import campusReducer from '@/features/slice/campusSlice'
import matkulReducer from '@/features/slice/matkulSlice'
import ruanganReducer from '@/features/slice/ruanganSlice'
import tAkademikReducer from '@/features/slice/tAkademikSlice'
import kurikulumReducer from '@/features/slice/kurikulumSlice'
import jadwalReducer from '@/features/slice/jadwalSlice'
import { injectStore } from '@/api/axios'
import { toastMiddleware } from './middleware/toast-middleware'
// ...

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    campus: campusReducer,
    matkul: matkulReducer,
    ruangan: ruanganReducer,
    tAkademik: tAkademikReducer,
    kurikulum: kurikulumReducer,
    jadwal: jadwalReducer
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(
      toastMiddleware.middleware
    ),

})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

injectStore(store);