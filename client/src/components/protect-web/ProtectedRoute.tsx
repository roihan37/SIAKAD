import { Navigate, Outlet, useLocation } from "react-router"
import { useAppSelector } from "@/hooks/redux"
import { SessionGate } from "./SessionGate"
import PasswordChange from "./PasswordChange"
export default function ProtectedRoute() {
  const { accessToken, user } = useAppSelector(state => state.auth)
  const location = useLocation()
  return <SessionGate>{!accessToken || !user ? <Navigate to="/" replace state={{ from: location }} /> : user.mustChangePassword ? <PasswordChange /> : <Outlet />}</SessionGate>
}
