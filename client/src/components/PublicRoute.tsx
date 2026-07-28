import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "@/hooks/redux";

export default function PublicRoute() {
  const { accessToken } = useAppSelector((state) => state.users);
  console.log(accessToken, '<< access');
  
  if (accessToken) {
    return <Navigate to="/mahasiswa" replace />;
  }

  return <Outlet />;
}