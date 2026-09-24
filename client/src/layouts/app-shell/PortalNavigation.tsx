import { Link, useLocation } from "react-router"
import { navigationIcons } from "@/navigation/navigation-icons"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/ui/sidebar"
import type { PortalNavigationGroup } from "@/navigation/types"
export function PortalNavigation({ basePath, groups }: { basePath: string; groups: PortalNavigationGroup[] }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  return <>{groups.map(group => <SidebarGroup key={group.label}><SidebarGroupLabel>{group.label}</SidebarGroupLabel><SidebarMenu>
    {group.items.map(item => {
      const url = `${basePath}/${item.path}`
      const active = pathname === url || pathname.startsWith(`${url}/`)
      const Icon = navigationIcons[item.icon]
      return <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={active} tooltip={item.title}
        className="transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] data-active:font-semibold data-active:shadow-[inset_3px_0_0_0_currentColor] motion-reduce:transition-none motion-reduce:transform-none"
        render={<Link to={url} aria-current={active ? "page" : undefined} onClick={event => { if (isMobile && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setOpenMobile(false) }} />}>
        <Icon /><span>{item.title}</span>
      </SidebarMenuButton></SidebarMenuItem>
    })}
  </SidebarMenu></SidebarGroup>)}</>
}
