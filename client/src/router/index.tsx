import BaseLayout from "@/layouts/BaseLayout";
import LoginPage from "@/pages/LoginPage";
import { createBrowserRouter } from "react-router";
import MahasiswaPage from "@/pages/Mahasiswa/MahasiswaPage";
import DosenPage from "@/pages/DosenPage";
import FakultasPage from "@/pages/FakultasPage";
import MatkulPage from "@/pages/MatkulPage";
import PStudiPage from "@/pages/ProdiPage";
import ProtectedRoute from "@/components/protect-web/ProtectedRoute";
import PublicRoute from "@/components/protect-web/PublicRoute";
import RuanganPage from "@/pages/RuanganPage";
import TAkademikPage from "@/pages/TAkademikPage";
import KurikulumPage from "@/pages/KurikulumPage";
import JadwalPage from "@/pages/JadwalKuliahPage";
import KRSPage from "@/pages/KRSPage";
import MahasiswaDetailPage from "@/pages/Mahasiswa/MahasiswaDetailPage";
import MahasiswaEditPage from "@/pages/Mahasiswa/MahasiswaEditPage";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <BaseLayout />,
        children: [
          {
            path: "/mahasiswa",
            element: <MahasiswaPage />,
          },
          {
            path: "/mahasiswa/:id",
            element: <MahasiswaDetailPage />,
          },
          {
            path: "/mahasiswa/:id/edit",
            element: <MahasiswaEditPage />,
          },
          {
            path: "/dosen",
            element: <DosenPage />,
          },
          {
            path: "/fakultas",
            element: <FakultasPage />,
          },
          {
            path: "/mata-kuliah",
            element: <MatkulPage />,
          },
          {
            path: "/program-studi",
            element: <PStudiPage />,
          },
          {
            path: "/ruangan",
            element: <RuanganPage />,
          },
          {
            path: "/tahun-akademik",
            element: <TAkademikPage />,
          },
          {
            path: "/kurikulum",
            element: <KurikulumPage />,
          },
          {
            path: "/jadwal-kuliah",
            element: <JadwalPage />,
          },
          {
            path: "/krs",
            element: <KRSPage />,
          },
        ],
      },
    ],
  },

  {
    element: <PublicRoute />,
    children: [
      {
        path: "/",
        element: <LoginPage />,
      },
    ],
  },
]);

export default router;