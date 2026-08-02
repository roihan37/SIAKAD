import {
  RouterProvider,
} from "react-router";
import router from "./router";
import { useEffect } from "react";
import { refreshToken } from "./features/action/authThunk";
import { useAppDispatch } from "./hooks/redux";

function App() {
  const dispatch = useAppDispatch()

  useEffect(()=>{
    dispatch(refreshToken())
  }, [dispatch])
  return (
    <RouterProvider router={router} />

  )
}

export default App
