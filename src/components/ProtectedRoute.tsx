import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { firebaseUser, profile, profileError, loading, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Cargando…
      </div>
    );
  }

  if (!firebaseUser) return <Navigate to="/login" replace />;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const errorScreen = (message: string) => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
        <h1 className="mb-2 text-lg font-bold text-slate-800">No pudimos cargar tu cuenta</h1>
        <p className="mb-6 text-sm text-slate-500">{message}</p>
        <div className="flex justify-center gap-3">
          <button onClick={() => void refreshProfile()} className="btn-primary">
            Reintentar
          </button>
          <button onClick={() => void handleLogout()} className="btn-secondary">
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );

  if (!profile) {
    return errorScreen(
      profileError ?? "No se pudo obtener tu perfil desde el servidor. Intenta de nuevo."
    );
  }

  if (profile.role === "CIUDADANO") {
    return <Navigate to="/registrar-organizacion" replace />;
  }

  if (profile.role === "ADMINISTRADOR" && !profile.organizationId) {
    return errorScreen(
      "Tu cuenta no está vinculada a ninguna organización. Contacta al equipo de Rescatta."
    );
  }

  // Mientras espera verificación, la organización sí puede corregir sus datos.
  const canEditPendingProfile = location.pathname === "/perfil";
  if (profile.organizationId && !profile.organizationVerified && !canEditPendingProfile) {
    return <Navigate to="/pendiente-verificacion" replace />;
  }

  return <Outlet />;
}
