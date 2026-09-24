import { Navigate, type RouteObject } from "react-router"
import type { PortalNavigationGroup } from "@/navigation/types"
import { createLazyPage } from "./lazy-page"

const ComingSoonPage = createLazyPage(() => import("@/pages/ComingSoon/ComingSoonPage"))

// Navigation and placeholder routes share one source until each module is available.
export function createPortalRoutes(basePath: string, groups: PortalNavigationGroup[]): RouteObject[] {
  return [
    { index: true, element: <Navigate to={`${basePath}/dashboard`} replace /> },
    ...groups.flatMap(group => group.items.map(item => ({
      path: item.path,
      element: <ComingSoonPage key={item.path} title={item.title} dashboardPath={`${basePath}/dashboard`} />,
    }))),
  ]
}
