import { useState, type MouseEvent, type ReactNode } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar } from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import { Link, useLocation } from "react-router"

type NavItem = { title: string; url: string; icon?: ReactNode; isActive?: boolean; items?: { title: string; url: string; icon?: ReactNode }[] }
const matchesPath = (pathname: string, url: string) => url.startsWith("/") && (pathname === url || (url !== "/" && pathname.startsWith(`${url}/`)))
const interactionClass = "transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] motion-reduce:transition-none motion-reduce:transform-none"
const activeClass = `${interactionClass} data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-active:font-semibold data-active:shadow-[inset_3px_0_0_0_currentColor]`

function NavSection({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  const { state, isMobile, setOpen } = useSidebar()
  const active = item.items?.some(child => matchesPath(pathname, child.url)) ?? false
  const [expansion, setExpansion] = useState({ pathname, open: active || !!item.isActive })
  // Stable component keys preserve manual expansion. A new route reveals its active group.
  const open = expansion.open || (expansion.pathname !== pathname && active)
  return <Collapsible open={open} onOpenChange={next => {
    if (!isMobile && state === "collapsed") { setOpen(true); setExpansion({ pathname, open: true }); return }
    setExpansion({ pathname, open: next })
  }} className="group/collapsible" render={<SidebarMenuItem />}>
    <CollapsibleTrigger render={<SidebarMenuButton tooltip={item.title} className={`${interactionClass} ${active ? "font-semibold text-sidebar-foreground [&>svg:first-child]:text-sidebar-primary" : ""}`} />}>
      {item.icon}<span>{item.title}</span><ChevronRightIcon className="ml-auto transition-transform duration-200 ease-out group-data-open/collapsible:rotate-90 motion-reduce:transition-none" />
    </CollapsibleTrigger>
    <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden opacity-100 transition-[height,opacity] duration-200 ease-out data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0 motion-reduce:transition-none">
      <SidebarMenuSub>{item.items?.map(child => <SidebarMenuSubItem key={child.url}>
        <SidebarMenuSubButton isActive={matchesPath(pathname, child.url)} className={activeClass} render={<Link to={child.url} onClick={onNavigate} aria-current={matchesPath(pathname, child.url) ? "page" : undefined} />}>
          {child.icon}<span>{child.title}</span>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>)}</SidebarMenuSub>
    </CollapsibleContent>
  </Collapsible>
}

export function NavMain({ items }: { items: NavItem[] }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const onNavigate = (event: MouseEvent<HTMLAnchorElement>) => {
    if (isMobile && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) setOpenMobile(false)
  }
  return <SidebarGroup><SidebarGroupLabel>Platform</SidebarGroupLabel><SidebarMenu>
    {items.map(item => item.items?.length ? <NavSection key={item.title} item={item} pathname={pathname} onNavigate={onNavigate} /> : <SidebarMenuItem key={item.title}>
      <SidebarMenuButton isActive={matchesPath(pathname, item.url)} className={activeClass} render={<Link to={item.url} onClick={onNavigate} aria-current={matchesPath(pathname, item.url) ? "page" : undefined} />} tooltip={item.title}>
        {item.icon}<span>{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>)}
  </SidebarMenu></SidebarGroup>
}
