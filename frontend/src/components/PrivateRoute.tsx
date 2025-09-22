// src/components/PrivateRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function PrivateRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />; // 👈 importante para montar children
}
