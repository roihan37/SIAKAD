import BaseLayout from "@/layouts/BaseLayout";
import LoginPage from "@/pages/LoginPage";
import { createBrowserRouter } from "react-router";
import MahasiswaPage from "@/pages/MahasiswaPage";

const router = createBrowserRouter([
  {
    element:
      <BaseLayout />,
      children : [
        {
          path: "/mahasiswa",
          element: <MahasiswaPage/>
        },
      ]
  },
  {
    path: "/",
    element: <LoginPage/>
  },
]);

export default router
