import { Navigate, Outlet } from "react-router"
import { useAppSelector } from "@/hooks/redux"
import { roleHome } from "@/router/role-paths"
import { SessionGate } from "./SessionGate"
export default function PublicRoute() {
  const { accessToken, user } = useAppSelector(state => state.auth)
  return <SessionGate>{accessToken && user ? <Navigate to={roleHome(user.role)} replace /> : <Outlet />}</SessionGate>
}
