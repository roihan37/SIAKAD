import { GraduationCap } from "lucide-react"
import { Link } from "react-router"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

export function SidebarBrand() {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip="SIAKAD · Dashboard"
          className="h-auto gap-3 rounded-xl py-3 hover:bg-sidebar-accent/60 group-data-[collapsible=icon]:p-0!"
          render={<Link to="/dashboard" aria-label="SIAKAD — buka Dashboard" onClick={() => { if (isMobile) setOpenMobile(false) }} />}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm ring-1 ring-black/5 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-lg">
            <GraduationCap className="size-6 group-data-[collapsible=icon]:size-5" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-1 group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold leading-none tracking-[0.12em] text-sidebar-foreground">SIAKAD</span>
            <span className="text-[11px] leading-4 text-muted-foreground">Sistem Informasi Akademik</span>
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
