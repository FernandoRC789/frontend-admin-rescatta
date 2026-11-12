import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (error) {
      const code = (error as { code?: string }).code;
      const messages: Record<string, string> = {
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/user-not-found": "Correo o contraseña incorrectos.",
        "auth/wrong-password": "Correo o contraseña incorrectos.",
        "auth/too-many-requests": "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
        "auth/network-request-failed": "No se pudo conectar con Firebase. Revisa tu conexión.",
      };
      setError(messages[code ?? ""] ?? "No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6 flex flex-col items-center gap-2">
          <PawPrint className="h-10 w-10 text-brand-600" />
          <h1 className="text-xl font-bold text-slate-800">Panel de Rescatta</h1>
          <p className="text-sm text-slate-400">Para veterinarias y refugios</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Ingresando…" : "Ingresar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿Tu veterinaria o refugio aún no está registrado?{" "}
          <Link to="/registrar-organizacion" className="font-medium text-brand-600 hover:underline">
            Regístrala aquí
          </Link>
        </p>
      </div>
    </div>
  );
}
