import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"
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


export function AppShell({ dashboardPath, navigation, pageLabels, mobileNavigation, studentUser = false }: { dashboardPath: string; navigation: ReactNode; pageLabels: Record<string, string>; mobileNavigation?: ReactNode; studentUser?: boolean }) {
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const hasMobileNavigation = Boolean(mobileNavigation)
  const [section, id, action] = pathname.split("/").filter(Boolean).slice(1)
  const sectionLabel = pageLabels[section] ?? "SIAKAD"
  const pageLabel = id ? `${action === "edit" ? "Edit" : "Detail"} ${sectionLabel}` : sectionLabel

  return (
    <SidebarProvider>
      {!(hasMobileNavigation && isMobile) && <AppSidebar dashboardPath={dashboardPath}>{navigation}</AppSidebar>}
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className={cn("-ml-1 shrink-0", hasMobileNavigation && "hidden md:inline-flex")} />
            <Separator orientation="vertical" className={cn("h-4 shrink-0", hasMobileNavigation && "hidden md:block")} />
            <Breadcrumb className="min-w-0">
              <BreadcrumbList className="flex-nowrap">
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink render={<Link to={id ? `${dashboardPath.slice(0, dashboardPath.lastIndexOf("/"))}/${section}` : dashboardPath} />}>
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
          <NavUser student={studentUser} />
        </header>
        <div className={cn("flex flex-1 flex-col gap-4 p-4 pt-0", hasMobileNavigation && "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4")}>
          <Outlet />
        </div>
        {isMobile && mobileNavigation}
      </SidebarInset>
    </SidebarProvider>
  )
}
