import type { PortalNavigationGroup } from "./types"
// Keep lecturer navigation minimal until its academic features are defined.
export const dosenNavigation: PortalNavigationGroup[] = [
  { label: "UTAMA", items: [{ title: "Dashboard", path: "dashboard", icon: "dashboard" }] },
  { label: "AKUN", items: [
    { title: "Profil", path: "profil", icon: "profile" },
    { title: "Ubah Password", path: "ubah-password", icon: "password" },
  ] },
]
