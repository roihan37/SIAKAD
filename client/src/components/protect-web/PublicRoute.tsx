import { Navigate, Outlet } from "react-router";
import { useAppSelector } from "@/hooks/redux";

export default function PublicRoute() {
  const { accessToken } = useAppSelector((state) => state.auth);
  // console.log(accessToken, '<< public');
  
  if (accessToken) {
    return <Navigate to="/mahasiswa" replace />;
  }

  return <Outlet />;
}