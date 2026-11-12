import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, HeartHandshake, XCircle } from "lucide-react";
import { fetchAdminStats } from "../api/reportsApi";
import { fetchAdminInbox } from "../api/reportsApi";
import type { ReportStats, ReportSummary } from "../types";
import StatusBadge from "../components/StatusBadge";
import ErrorState from "../components/ErrorState";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../lib/errors";
import { handleImageError, resolveImageUrl } from "../lib/imageUrl";

const CARDS: { key: keyof ReportStats; label: string; icon: typeof Clock; color: string; status?: string }[] = [
  { key: "pendientes", label: "Pendientes", icon: Clock, color: "text-amber-600 bg-amber-100", status: "PENDIENTE" },
  { key: "aprobados", label: "Aprobados", icon: CheckCircle2, color: "text-sky-600 bg-sky-100", status: "APROBADO" },
  { key: "enProceso", label: "En proceso", icon: AlertCircle, color: "text-indigo-600 bg-indigo-100", status: "EN_PROCESO" },
  { key: "rescatados", label: "Rescatados", icon: HeartHandshake, color: "text-brand-600 bg-brand-100", status: "RESCATADO" },
  { key: "rechazados", label: "Rechazados", icon: XCircle, color: "text-rose-600 bg-rose-100", status: "RECHAZADO" },
];

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [recent, setRecent] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const [statsRes, inboxRes] = await Promise.all([
        fetchAdminStats(),
        fetchAdminInbox({ page: 0, size: 6 }),
      ]);
      if (requestId !== requestIdRef.current) return;
      setStats(statsRes);
      setRecent(inboxRes.content);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(loadError, "No se pudo cargar el dashboard."));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Hola, {profile?.organizationName ?? "administrador"} 👋</h1>
        <p className="text-sm text-slate-500">Este es el resumen de tus reportes en Rescatta.</p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void load()} />
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
            {CARDS.map(({ key, label, icon: Icon, color, status }) => (
              <Link
                key={key}
                to={`/reportes?status=${status}`}
                className="card flex flex-col gap-3 transition hover:shadow-md hover:ring-brand-200"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">{loading ? "…" : stats?.[key] ?? 0}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-800">Reportes recientes</h2>
              <Link to="/reportes" className="text-sm font-medium text-brand-600 hover:underline">
                Ver todos
              </Link>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Cargando…</p>
            ) : recent.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No hay reportes todavía.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    to={`/reportes/${r.id}`}
                    className="flex items-center gap-4 py-3 transition hover:bg-slate-50 -mx-2 px-2 rounded-lg"
                  >
                    <img
                      src={resolveImageUrl(r.coverPhotoUrl)}
                      alt=""
                      onError={handleImageError}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {r.species === "PERRO" ? "🐶" : r.species === "GATO" ? "🐱" : "🐾"} {r.address ?? "Sin dirección"}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {new Date(r.createdAt).toLocaleString("es-PE")}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
