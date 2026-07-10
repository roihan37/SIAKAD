import BaseLayout from "@/layouts/BaseLayout";
import LoginPage from "@/pages/LoginPage";
import { createBrowserRouter } from "react-router";
import MahasiswaPage from "@/pages/MahasiswaPage";
import DosenPage from "@/pages/DosenPage";
import FakultasPage from "@/pages/FakultasPage";
import MatkulPage from "@/pages/MatkulPage";
import PStudiPage from "@/pages/PStudiPage";

const router = createBrowserRouter([
  {
    element:
      <BaseLayout />,
      children : [
        {
          path: "/mahasiswa",
          element: <MahasiswaPage/>
        },
        {
          path: "/dosen",
          element: <DosenPage/>
        },
        {
          path: "/fakultas",
          element: <FakultasPage/>
        },
        {
          path: "/mata-kuliah",
          element: <MatkulPage/>
        },
        {
          path: "/program-studi",
          element: <PStudiPage/>
        },
      ]
  },
  {
    path: "/",
    element: <LoginPage/>
  },
]);

export default router
