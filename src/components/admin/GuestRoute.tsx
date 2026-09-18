import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AdminLoadingScreen } from "./AdminLoadingScreen";

interface GuestRouteProps {
  children: ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { status } = useAuth();

  if (status === "loading") {
    return <AdminLoadingScreen />;
  }

  if (status === "authenticated") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

