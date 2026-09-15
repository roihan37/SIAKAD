import { comingSoonPages } from "@/pages/ComingSoon/coming-soon-pages"
import { Link, Outlet, useLocation } from "react-router"

import { AppSidebar } from "@/components/nav/app-sidebar"
import { NavUser } from "@/components/nav/nav-user"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

const pageLabels: Record<string, string> = {
  ...Object.fromEntries(comingSoonPages.map(({ path, title }) => [path.slice(1), title])),
  dashboard: "Dashboard",
  "tagihan-ukt": "Tagihan UKT",
  pembayaran: "Pembayaran",
  presensi: "Presensi",
  nilai: "Nilai",
  mahasiswa: "Mahasiswa",
  dosen: "Dosen",
  fakultas: "Fakultas",
  "program-studi": "Program Studi",
  "mata-kuliah": "Mata Kuliah",
  ruangan: "Ruangan",
  "tahun-akademik": "Tahun Akademik",
  kurikulum: "Kurikulum",
  "jadwal-kuliah": "Jadwal Kuliah",
  krs: "KRS",
}

export default function BaseLayout() {
  const { pathname } = useLocation()
  const [section, id, action] = pathname.split("/").filter(Boolean)
  const sectionLabel = pageLabels[section] ?? "SIAKAD"
  const pageLabel = id ? `${action === "edit" ? "Edit" : "Detail"} ${sectionLabel}` : sectionLabel

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator orientation="vertical" className="h-4 shrink-0" />
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink render={<Link to={id ? `/${section}` : "/dashboard"} />}>
                    {id ? sectionLabel : "SIAKAD"}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage className="truncate font-medium">{pageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <NavUser />
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
