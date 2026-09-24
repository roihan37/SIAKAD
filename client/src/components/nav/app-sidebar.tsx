import type { ComponentProps, ReactNode } from "react"
import { SidebarBrand } from "./sidebar-brand"
import { Sidebar, SidebarContent, SidebarHeader, SidebarRail } from "@/components/ui/sidebar"
type Props = ComponentProps<typeof Sidebar> & { dashboardPath: string; children: ReactNode }
export function AppSidebar({ dashboardPath, children, ...props }: Props) {
  return <Sidebar collapsible="icon" {...props}>
    <SidebarHeader className="border-b border-sidebar-border/70 pb-3"><SidebarBrand dashboardPath={dashboardPath} /></SidebarHeader>
    <SidebarContent>{children}</SidebarContent>
    <SidebarRail />
  </Sidebar>
}
