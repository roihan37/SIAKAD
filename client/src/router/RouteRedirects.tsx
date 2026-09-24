import { Navigate, useLocation } from "react-router"
import { useAppSelector } from "@/hooks/redux"
import { roleHome } from "./role-paths"
export function RoleHomeRedirect() {
  const role = useAppSelector(state => state.auth.user?.role)
  return <Navigate to={roleHome(role)} replace />
}
export function LegacyAdminRedirect() {
  const { pathname, search, hash } = useLocation()
  return <Navigate to={`/admin${pathname}${search}${hash}`} replace />
}
