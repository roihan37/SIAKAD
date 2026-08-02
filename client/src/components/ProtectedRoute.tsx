import { Navigate, Outlet, useLocation } from "react-router";
import { useAppSelector } from "@/hooks/redux";
import React, { useEffect } from "react";

export default function ProtectedRoute() {
  const { accessToken } = useAppSelector((state) => state.users);
  const location = useLocation();

  useEffect(() => {
    console.log("ACCESS TOKEN BERUBAH:", accessToken);
  }, [accessToken]);

  // console.log(accessToken, "<<< protect");

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