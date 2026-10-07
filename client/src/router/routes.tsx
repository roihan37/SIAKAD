import type { RouteObject } from "react-router"
import ProtectedRoute from "@/components/protect-web/ProtectedRoute"
import PublicRoute from "@/components/protect-web/PublicRoute"
import RoleGuard from "@/components/protect-web/RoleGuard"
import LoginPage from "@/pages/LoginPage"
import { mahasiswaNavigation } from "@/navigation/mahasiswa-navigation"
import { dosenNavigation } from "@/navigation/dosen-navigation"
import { createPortalRoutes } from "./portal-routes"
import { adminRoutes, legacyAdminPaths } from "./admin-routes"
import { createLazyPage } from "./lazy-page"
import { LegacyAdminRedirect, RoleHomeRedirect } from "./RouteRedirects"

const AdminLayout = createLazyPage(() => import("@/layouts/admin/AdminLayout"))
const MahasiswaLayout = createLazyPage(() => import("@/layouts/mahasiswa/MahasiswaLayout"))
const DosenLayout = createLazyPage(() => import("@/layouts/dosen/DosenLayout"))
const PortalPendingPage = createLazyPage(() => import("@/pages/Portal/PortalPendingPage"))
const MahasiswaDashboardPage = createLazyPage(() => import("@/pages/mahasiswa/Dashboard/MahasiswaDashboardPage"))
const MahasiswaKRSPage = createLazyPage(() => import("@/pages/mahasiswa/KRS/MahasiswaKRSPage"))
const MahasiswaJadwalPage = createLazyPage(() => import("@/pages/mahasiswa/Jadwal/MahasiswaJadwalPage"))
const MahasiswaAIAssistantPage = createLazyPage(() => import("@/pages/mahasiswa/AIAssistant/MahasiswaAIAssistantPage"))
export const routes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleGuard role="Admin" />,
        children: [
          { path: "/admin", element: <AdminLayout />, children: [{ index: true, element: <RoleHomeRedirect /> }, ...adminRoutes] },
          // Existing bookmarks retain params, query filters and hashes after migration.
          ...legacyAdminPaths.filter(path => path !== "/mahasiswa" && path !== "/dosen").map(path => ({ path, element: <LegacyAdminRedirect /> })),
        ],
      },
      { element: <RoleGuard role="Mahasiswa" />, children: [
        { path: "/mahasiswa", element: <MahasiswaLayout />, children: createPortalRoutes("/mahasiswa", mahasiswaNavigation, { dashboard: <MahasiswaDashboardPage />, krs: <MahasiswaKRSPage />, "jadwal-kuliah": <MahasiswaJadwalPage />, "ai-assistant": <MahasiswaAIAssistantPage /> }) },
      ] },
      { element: <RoleGuard role="Dosen" />, children: [
        { path: "/dosen", element: <DosenLayout />, children: createPortalRoutes("/dosen", dosenNavigation) },
      ] },
      { path: "/akses-terbatas", element: <PortalPendingPage /> },
      { path: "*", element: <RoleHomeRedirect /> },
    ],
  },
  { element: <PublicRoute />, children: [{ path: "/", element: <LoginPage /> }] },
]
