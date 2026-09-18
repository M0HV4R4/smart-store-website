import { type ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AdminLoadingScreen } from "./AdminLoadingScreen";

interface ProtectedRouteProps {
  children?: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth();

  if (status === "loading") {
    return <AdminLoadingScreen />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/admin/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

