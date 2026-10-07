import {
  RouterProvider,
} from "react-router";
import router from "./router";
import { useEffect } from "react";
import { refreshToken } from "./features/action/authThunk";
import { useAppDispatch } from "./hooks/redux";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "next-themes";

function App() {
  const dispatch = useAppDispatch()

  useEffect(()=>{
    dispatch(refreshToken())
  }, [dispatch])
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <RouterProvider router={router} />
      <Toaster 
      position="top-right"
      offset="64px"
      />
    </ThemeProvider>

  )
}

export default App
