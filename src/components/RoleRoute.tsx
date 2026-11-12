import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../types";

export default function RoleRoute({
  allowed,
  children,
}: {
  allowed: UserRole[];
  children: ReactNode;
}) {
  const { profile } = useAuth();

  if (!profile) return <Navigate to="/login" replace />;
  if (!allowed.includes(profile.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
