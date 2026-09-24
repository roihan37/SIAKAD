import type { RouteObject } from "react-router"
import { comingSoonPages } from "@/pages/ComingSoon/coming-soon-pages"
import { createLazyPage, type PageLoader } from "./lazy-page"

// Explicit import paths let Vite produce predictable page chunks and validate missing modules.
type PageRoute = { path: string; load: PageLoader }

const pages = [
  { path: "/dashboard", load: () => import("@/pages/admin/Dashboard/DashboardPage") },
  { path: "/mahasiswa", load: () => import("@/pages/admin/Mahasiswa/MahasiswaPage") },
  { path: "/mahasiswa/:id", load: () => import("@/pages/admin/Mahasiswa/MahasiswaDetailPage") },
  { path: "/mahasiswa/:id/edit", load: () => import("@/pages/admin/Mahasiswa/MahasiswaEditPage") },
  { path: "/dosen", load: () => import("@/pages/admin/Dosen/DosenPage") },
  { path: "/dosen/:id", load: () => import("@/pages/admin/Dosen/DosenDetailPage") },
  { path: "/dosen/:id/edit", load: () => import("@/pages/admin/Dosen/DosenEditPage") },
  { path: "/fakultas", load: () => import("@/pages/admin/Fakultas/FakultasPage") },
  { path: "/program-studi", load: () => import("@/pages/admin/Prodi/ProdiPage") },
  { path: "/mata-kuliah", load: () => import("@/pages/admin/Matkul/MatkulPage") },
  { path: "/ruangan", load: () => import("@/pages/admin/Ruangan/RuanganPage") },
  { path: "/tahun-akademik", load: () => import("@/pages/admin/TAkademik/TAkademikPage") },
  { path: "/kurikulum", load: () => import("@/pages/admin/Kurikulum/KurikulumPage") },
  { path: "/jadwal-kuliah", load: () => import("@/pages/admin/Jadwal/JadwalKuliahPage") },
  { path: "/krs", load: () => import("@/pages/admin/KRS/KRSPage") },
  { path: "/nilai", load: () => import("@/pages/admin/Nilai/NilaiPage") },
  { path: "/presensi", load: () => import("@/pages/admin/Presensi/PresensiPage") },
  { path: "/tagihan-ukt", load: () => import("@/pages/admin/TagihanUKT/TagihanUKTPage") },
  { path: "/pembayaran", load: () => import("@/pages/admin/Pembayaran/PembayaranPage") },
] satisfies readonly PageRoute[]

const ComingSoon = createLazyPage(() => import("@/pages/ComingSoon/ComingSoonPage"))
export const legacyAdminPaths = [...pages.map(page => page.path), ...comingSoonPages.map(page => page.path)]

export const adminRoutes: RouteObject[] = [
  ...pages.map(({ path, load }) => {
    const Page = createLazyPage(load)
    return { path: path.slice(1), element: <Page /> }
  }),
  ...comingSoonPages.map(({ path, title }) => ({ path: path.slice(1), element: <ComingSoon key={path} title={title} /> })),
]
