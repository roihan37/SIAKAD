import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "@/hooks/redux";

export default function PublicRoute() {
  const { accessToken } = useAppSelector((state) => state.users);
  // console.log(accessToken, '<< public');
  
  if (accessToken) {
    return <Navigate to="/mahasiswa" replace />;
  }

  return <Outlet />;
}