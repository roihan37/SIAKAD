"use client"

import { Link, useLocation } from "react-router"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

export function NavProjects({ profile }: { profile: { name: string; url: string; icon: React.ReactNode }[] }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  return <SidebarGroup className="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>Pengaturan Akun</SidebarGroupLabel>
    <SidebarMenu>{profile.map((item) => <SidebarMenuItem key={item.name}>
      <SidebarMenuButton isActive={pathname === item.url} render={<Link to={item.url} />} onClick={() => { if (isMobile) setOpenMobile(false) }}>
        {item.icon}<span>{item.name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>)}</SidebarMenu>
  </SidebarGroup>
}
