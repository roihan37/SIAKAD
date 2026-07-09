import LoginPage from "@/pages/LoginPage";
import { createBrowserRouter } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage/>
  },
]);

export default router
