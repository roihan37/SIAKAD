export type PortalRole = "Admin" | "Mahasiswa" | "Dosen"
const homes: Record<PortalRole, string> = {
  Admin: "/admin/dashboard",
  Mahasiswa: "/mahasiswa/dashboard",
  Dosen: "/dosen/dashboard",
}
export function roleHome(role: string | undefined): string {
  return role && Object.hasOwn(homes, role) ? homes[role as PortalRole] : "/akses-terbatas"
}
