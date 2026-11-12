import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchAdminInbox } from "../api/reportsApi";
import type { ReportStatus, ReportSummary, Species } from "../types";
import StatusBadge from "../components/StatusBadge";
import ErrorState from "../components/ErrorState";
import { getErrorMessage } from "../lib/errors";
import { handleImageError, resolveImageUrl } from "../lib/imageUrl";

const STATUS_OPTIONS: { value: ReportStatus | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "APROBADO", label: "Aprobado" },
  { value: "EN_PROCESO", label: "En proceso" },
  { value: "RESCATADO", label: "Rescatado" },
  { value: "RECHAZADO", label: "Rechazado" },
];

const SPECIES_OPTIONS: { value: Species | ""; label: string }[] = [
  { value: "", label: "Todas las especies" },
  { value: "PERRO", label: "Perro" },
  { value: "GATO", label: "Gato" },
  { value: "OTRO", label: "Otro" },
];

export default function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const rawStatus = params.get("status");
  const rawSpecies = params.get("species");
  const status = STATUS_OPTIONS.some((option) => option.value === rawStatus)
    ? (rawStatus as ReportStatus)
    : "";
  const species = SPECIES_OPTIONS.some((option) => option.value === rawSpecies)
    ? (rawSpecies as Species)
    : "";
  const onlyMine = params.get("onlyMine") === "true";

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  const filtersKey = `${status}|${species}|${onlyMine}`;
  const previousFiltersRef = useRef(filtersKey);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const filtersChanged = previousFiltersRef.current !== filtersKey;
    if (filtersChanged) {
      previousFiltersRef.current = filtersKey;
      // Evita disparar una petición con la página vieja y luego otra con la página 0.
      if (page !== 0) {
        setPage(0);
        return;
      }
    }

    const requestId = ++requestIdRef.current;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchAdminInbox({
          status: status || undefined,
          species: species || undefined,
          onlyMine,
          page,
        });
        if (cancelled || requestId !== requestIdRef.current) return;
        setReports(res.content);
        setTotalPages(res.totalPages || 1);
      } catch (loadError) {
        if (cancelled || requestId !== requestIdRef.current) return;
        setError(getErrorMessage(loadError, "No se pudieron cargar los reportes."));
      } finally {
        if (!cancelled && requestId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filtersKey, onlyMine, page, reloadKey, species, status]);

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-6xl p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Reportes</h1>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => updateParam("status", e.target.value)}
            className="input w-auto"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={species}
            onChange={(e) => updateParam("species", e.target.value)}
            className="input w-auto"
          >
            {SPECIES_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => updateParam("onlyMine", e.target.checked ? "true" : "")}
            />
            Solo mi organización
          </label>
        </div>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      ) : (
        <div className="card overflow-hidden !p-0">
          {loading ? (
            <p className="py-12 text-center text-sm text-slate-400">Cargando…</p>
          ) : reports.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-400">No hay reportes con estos filtros.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {reports.map((r) => (
                <Link
                  key={r.id}
                  to={`/reportes/${r.id}`}
                  className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
                >
                  <img
                    src={resolveImageUrl(r.coverPhotoUrl)}
                    alt=""
                    onError={handleImageError}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {r.species === "PERRO" ? "🐶 Perro" : r.species === "GATO" ? "🐱 Gato" : "🐾 Otro"} · {r.condition}
                    </p>
                    <p className="truncate text-xs text-slate-400">{r.address ?? "Sin dirección"}</p>
                    <p className="truncate text-xs text-slate-400">
                      {new Date(r.createdAt).toLocaleString("es-PE")}
                      {r.distanceKm != null && ` · ${r.distanceKm} km`}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {!error && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            disabled={loading || page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary px-3 py-1.5 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-slate-500">
            Página {page + 1} de {totalPages}
          </span>
          <button
            disabled={loading || page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary px-3 py-1.5 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
