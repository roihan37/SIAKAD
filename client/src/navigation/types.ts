export type NavigationIcon = "dashboard" | "krs" | "calendar" | "graduation" | "attendance" | "transcript" | "wallet" | "receipt" | "announcement" | "sparkles" | "profile" | "password" | "settings"
export interface PortalNavigationItem { title: string; path: string; icon: NavigationIcon }
export interface PortalNavigationGroup { label: string; items: PortalNavigationItem[] }
export function navigationLabels(groups: PortalNavigationGroup[]) {
  return Object.fromEntries(groups.flatMap(group => group.items.map(item => [item.path, item.title])))
}
