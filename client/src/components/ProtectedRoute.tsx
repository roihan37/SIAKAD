import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "@/hooks/redux";

export default function ProtectedRoute() {
  const { accessToken } = useAppSelector((state) => state.users);
  const location = useLocation();

  if (!accessToken) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
}