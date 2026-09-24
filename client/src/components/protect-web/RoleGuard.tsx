import { Navigate, Outlet } from "react-router"
import { useAppSelector } from "@/hooks/redux"
import { roleHome, type PortalRole } from "@/router/role-paths"
export default function RoleGuard({ role }: { role: PortalRole }) {
  const user = useAppSelector(state => state.auth.user)
  return user?.role === role ? <Outlet /> : <Navigate to={roleHome(user?.role)} replace />
}
