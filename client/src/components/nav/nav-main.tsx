import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import { Link, useLocation } from "react-router"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: React.ReactNode
    }[]
  }[]
}) {
  const { pathname } = useLocation()
  const matchesPath = (url: string) => url.startsWith("/") && (
    pathname === url || (url !== "/" && pathname.startsWith(`${url}/`))
  )
  const activeClassName = "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-semibold data-active:shadow-[inset_3px_0_0_0_currentColor]"
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => !item.items?.length ? (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton isActive={matchesPath(item.url)} className={activeClassName} render={<Link to={item.url} aria-current={matchesPath(item.url) ? "page" : undefined} />} tooltip={item.title}>
              {item.icon}<span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ) : (
          <Collapsible
            key={`${item.title}:${pathname}`}
            defaultOpen={item.items.some((subItem) => matchesPath(subItem.url)) || item.isActive}
            className="group/collapsible"
            render={<SidebarMenuItem />}
          >
            <CollapsibleTrigger
              render={<SidebarMenuButton tooltip={item.title} className={item.items.some((subItem) => matchesPath(subItem.url)) ? "font-semibold text-sidebar-foreground [&>svg:first-child]:text-sidebar-primary" : undefined} />}
            >
              {item.icon}
              <span>{item.title}</span>
              <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton isActive={matchesPath(subItem.url)} className={activeClassName} render={<Link to={subItem.url} aria-current={matchesPath(subItem.url) ? "page" : undefined} />}>
                      {subItem.icon}
                      <span>{subItem.title}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
