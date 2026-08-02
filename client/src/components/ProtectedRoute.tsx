import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "@/hooks/redux";

export default function ProtectedRoute() {
  const { accessToken,
          initialized
  } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!initialized) {
    return <p>Loading ...</p>;
  }

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