import TagihanUKTPage from "@/pages/TagihanUKT/TagihanUKTPage";
import ComingSoonPage from "@/pages/ComingSoon/ComingSoonPage";
import { comingSoonPages } from "@/pages/ComingSoon/coming-soon-pages";
import NilaiPage from "@/pages/Nilai/NilaiPage";
import PresensiPage from "@/pages/Presensi/PresensiPage";
import DashboardPage from "@/pages/Dashboard/DashboardPage";
import DosenEditPage from "@/pages/Dosen/DosenEditPage";
import DosenDetailPage from "@/pages/Dosen/DosenDetailPage";
import BaseLayout from "@/layouts/BaseLayout";
import LoginPage from "@/pages/LoginPage";
import { createBrowserRouter } from "react-router";
import MahasiswaPage from "@/pages/Mahasiswa/MahasiswaPage";
import DosenPage from "@/pages/Dosen/DosenPage";
import FakultasPage from "@/pages/Fakultas/FakultasPage";
import MatkulPage from "@/pages/Matkul/MatkulPage";
import PStudiPage from "@/pages/Prodi/ProdiPage";
import ProtectedRoute from "@/components/protect-web/ProtectedRoute";
import PublicRoute from "@/components/protect-web/PublicRoute";
import RuanganPage from "@/pages/Ruangan/RuanganPage";
import TAkademikPage from "@/pages/TAkademik/TAkademikPage";
import KurikulumPage from "@/pages/Kurikulum/KurikulumPage";
import JadwalPage from "@/pages/Jadwal/JadwalKuliahPage";
import KRSPage from "@/pages/KRS/KRSPage";
import MahasiswaDetailPage from "@/pages/Mahasiswa/MahasiswaDetailPage";
import MahasiswaEditPage from "@/pages/Mahasiswa/MahasiswaEditPage";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <BaseLayout />,
        children: [
          { path: "/tagihan-ukt", element: <TagihanUKTPage /> },
          ...comingSoonPages.map(({ path, title }) => ({ path, element: <ComingSoonPage title={title} /> })),
          {
            path: "/nilai",
            element: <NilaiPage />,
          },
          {
            path: "/presensi",
            element: <PresensiPage />,
          },
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
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
            path: "/dosen/:id/edit",
            element: <DosenEditPage />,
          },
          {
            path: "/dosen/:id",
            element: <DosenDetailPage />,
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