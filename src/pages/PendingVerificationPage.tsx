import { useEffect, useState } from "react";
import { Clock3, LogOut, PawPrint, RefreshCw } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { InlineError } from "../components/ErrorState";

export default function PendingVerificationPage() {
  const { profile, profileError, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.organizationVerified) {
      navigate("/", { replace: true });
    }
  }, [navigate, profile?.organizationVerified]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleCheck = async () => {
    setChecking(true);
    setMessage(null);
    try {
      await refreshProfile();
      setMessage("Si tu organización ya fue verificada, serás redirigido automáticamente.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-100">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <Clock3 className="h-7 w-7 text-amber-600" />
        </div>
        <div className="mb-2 flex items-center justify-center gap-2 text-slate-400">
          <PawPrint className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Rescatta</span>
        </div>
        <h1 className="mb-2 text-lg font-bold text-slate-800">
          {profile?.organizationName ?? "Tu organización"} está en revisión
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          El equipo de Rescatta está validando los datos de tu veterinaria/refugio. Mientras
          tanto no puedes gestionar reportes ni chatear con ciudadanos, pero sí puedes
          corregir los datos de tu organización.
        </p>

        {profileError && <InlineError message={profileError} />}
        {message && <p className="text-sm text-slate-500">{message}</p>}

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => void handleCheck()}
            disabled={checking}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Comprobando…" : "Ya me verificaron"}
          </button>
          <Link to="/perfil" className="btn-secondary">
            Editar datos
          </Link>
        </div>

        <button onClick={() => void handleLogout()} className="btn-secondary mx-auto mt-4 flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
