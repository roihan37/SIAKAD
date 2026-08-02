import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/slice/authSlice'
import usersReducer from '@/features/slice/usersSlice'
import { injectStore } from '@/api/axios'
// ...

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

injectStore(store);