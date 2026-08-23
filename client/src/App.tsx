import {
  RouterProvider,
} from "react-router";
import router from "./router";
import { useEffect } from "react";
import { refreshToken } from "./features/action/authThunk";
import { useAppDispatch } from "./hooks/redux";
import { Toaster } from "./components/ui/sonner";

function App() {
  const dispatch = useAppDispatch()

  useEffect(()=>{
    dispatch(refreshToken())
  }, [dispatch])
  return (
    <>
      <RouterProvider router={router} />
      <Toaster 
      position="top-right"
      offset="80px"
      />
    </>

  )
}

export default App
