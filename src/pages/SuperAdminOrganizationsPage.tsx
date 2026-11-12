import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, ShieldX } from "lucide-react";
import { fetchPendingOrganizations, verifyOrganization } from "../api/organizationsApi";
import type { OrganizationResponse } from "../types";
import ErrorState, { InlineError } from "../components/ErrorState";
import { getErrorMessage } from "../lib/errors";

export default function SuperAdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrganizationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const load = useCallback(async (targetPage: number) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchPendingOrganizations(targetPage);
      if (requestId !== requestIdRef.current) return;
      setOrgs(res.content);
      setPage(res.page);
      setTotalPages(res.totalPages || 1);
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(loadError, "No se pudieron cargar las organizaciones pendientes."));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page, reloadKey]);

  const handleVerify = async (id: number, verified: boolean) => {
    setActionId(id);
    setActionError(null);
    try {
      await verifyOrganization(id, verified);
      setConfirmingId(null);
      setOrgs((prev) => prev.filter((org) => org.id !== id));

      if (orgs.length === 1 && page > 0) {
        setPage((current) => current - 1);
      } else {
        setReloadKey((key) => key + 1);
      }
    } catch (verifyError) {
      setActionError(getErrorMessage(verifyError, "No se pudo actualizar la organización."));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Verificar organizaciones</h1>
      <p className="mb-6 text-sm text-slate-500">
        Veterinarias/refugios nuevos no pueden operar reportes hasta ser verificados por el equipo de Rescatta.
      </p>

      <InlineError message={actionError} />

      {error ? (
        <div className="mt-4">
          <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
        </div>
      ) : loading ? (
        <p className="py-12 text-center text-sm text-slate-400">Cargando…</p>
      ) : orgs.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">No hay organizaciones pendientes 🎉</p>
      ) : (
        <>
          <div className="mt-4 space-y-4">
            {orgs.map((org) => (
              <div key={org.id} className="card flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {org.name} <span className="text-xs font-normal text-slate-400">· {org.type}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    {org.address ?? "Sin dirección"}{org.district ? `, ${org.district}` : ""}
                  </p>
                  <p className="text-sm text-slate-500">
                    {org.phone ?? "Sin teléfono"} {org.email ? `· ${org.email}` : ""}
                  </p>
                  {org.description && <p className="mt-2 text-sm text-slate-600">{org.description}</p>}
                </div>

                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                  {confirmingId === org.id ? (
                    <div className="rounded-lg bg-rose-50 p-3 text-right text-sm text-rose-700">
                      <p className="mb-2">¿Rechazar esta organización?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void handleVerify(org.id, false)}
                          disabled={actionId === org.id}
                          className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {actionId === org.id ? "Rechazando…" : "Sí, rechazar"}
                        </button>
                        <button
                          onClick={() => setConfirmingId(null)}
                          disabled={actionId === org.id}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => void handleVerify(org.id, true)}
                        disabled={actionId === org.id}
                        className="btn-primary flex items-center gap-2"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        {actionId === org.id ? "Guardando…" : "Verificar"}
                      </button>
                      <button
                        onClick={() => setConfirmingId(org.id)}
                        disabled={actionId === org.id}
                        className="btn-secondary flex items-center gap-2 !text-rose-600"
                      >
                        <ShieldX className="h-4 w-4" /> Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                disabled={loading || page === 0}
                onClick={() => setPage((current) => current - 1)}
                className="btn-secondary px-3 py-1.5 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-sm text-slate-500">
                Página {page + 1} de {totalPages}
              </span>
              <button
                disabled={loading || page >= totalPages - 1}
                onClick={() => setPage((current) => current + 1)}
                className="btn-secondary px-3 py-1.5 disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
