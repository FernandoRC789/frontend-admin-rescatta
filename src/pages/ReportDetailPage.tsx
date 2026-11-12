import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { fetchAdminReportDetail, updateReportStatus } from "../api/reportsApi";
import type { ReportDetail, ReportStatus } from "../types";
import StatusBadge from "../components/StatusBadge";
import ErrorState, { InlineError } from "../components/ErrorState";
import { formatErrorWithFields } from "../lib/errors";
import { handleImageError, resolveImageUrl } from "../lib/imageUrl";

const NEXT_ACTIONS: Partial<Record<ReportStatus, { label: string; next: ReportStatus; style: string }[]>> = {
  PENDIENTE: [
    { label: "Aprobar y tomar caso", next: "APROBADO", style: "btn-primary" },
    { label: "Rechazar", next: "RECHAZADO", style: "btn-secondary !text-rose-600" },
  ],
  APROBADO: [
    { label: "Marcar en proceso", next: "EN_PROCESO", style: "btn-primary" },
    { label: "Rechazar", next: "RECHAZADO", style: "btn-secondary !text-rose-600" },
  ],
  EN_PROCESO: [{ label: "Marcar como rescatado", next: "RESCATADO", style: "btn-primary" }],
};

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    const reportId = Number(id);
    if (!id || !Number.isInteger(reportId) || reportId <= 0) {
      setError("El identificador del reporte no es válido.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminReportDetail(reportId);
      setReport(data);
      setAdminNotes(data.adminNotes ?? "");
      setNotesSaved(false);
    } catch (loadError) {
      setError(formatErrorWithFields(loadError, "No se pudo cargar el reporte."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const handleTransition = async (next: ReportStatus, reason?: string) => {
    if (!report) return;
    setSaving(true);
    setActionError(null);
    try {
      const updated = await updateReportStatus(report.id, next, reason, adminNotes);
      setReport(updated);
      setShowRejectForm(false);
      setNotesSaved(false);
    } catch (transitionError) {
      setActionError(formatErrorWithFields(transitionError, "No se pudo actualizar el estado del reporte."));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!report) return;
    setSaving(true);
    setNotesError(null);
    try {
      const updated = await updateReportStatus(report.id, report.status, undefined, adminNotes);
      setReport(updated);
      setNotesSaved(true);
    } catch (saveError) {
      setNotesError(formatErrorWithFields(saveError, "No se pudieron guardar las notas."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-sm text-slate-400">Cargando…</p>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <ErrorState message="No se encontró el reporte." onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    );
  }

  const actions = NEXT_ACTIONS[report.status] ?? [];

  return (
    <div className="mx-auto max-w-4xl p-8">
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">
              {report.species === "PERRO" ? "🐶 Perro" : report.species === "GATO" ? "🐱 Gato" : "🐾 Animal"} reportado
            </h1>
            <StatusBadge status={report.status} />
          </div>
          <p className="text-sm text-slate-500">Reportado el {new Date(report.createdAt).toLocaleString("es-PE")}</p>
        </div>

        {(report.status === "APROBADO" || report.status === "EN_PROCESO" || report.status === "RESCATADO") && (
          <Link to={`/chats?reportId=${report.id}`} className="btn-secondary flex items-center gap-2">
            <MessageCircle className="h-4 w-4" /> Chatear con el ciudadano
          </Link>
        )}
      </div>

      {report.photoUrls.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {report.photoUrls.map((url) => (
            <img
              key={url}
              src={resolveImageUrl(url)}
              alt=""
              onError={handleImageError}
              className="h-32 w-full rounded-xl object-cover"
            />
          ))}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Información del caso</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Condición</dt><dd className="font-medium text-slate-800">{report.condition}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Raza</dt><dd className="font-medium text-slate-800">{report.breedName ?? "No identificada"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Edad estimada</dt><dd className="font-medium text-slate-800">{report.ageGroup ?? "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">¿Reportante puede quedárselo?</dt><dd className="font-medium text-slate-800">{report.reporterCanStay ? "Sí, temporalmente" : "No"}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Dirección</dt><dd className="max-w-[60%] text-right font-medium text-slate-800">{report.address ?? "—"}</dd></div>
          </dl>
          {report.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Descripción del reportante</p>
              <p className="text-sm text-slate-700">{report.description}</p>
            </div>
          )}
          {report.rejectionReason && (
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              <strong>Motivo de rechazo:</strong> {report.rejectionReason}
            </div>
          )}
        </div>

        <div className="card !p-0 overflow-hidden">
          <MapContainer center={[report.latitude, report.longitude]} zoom={15} style={{ height: "100%", minHeight: 260 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            <Marker position={[report.latitude, report.longitude]} />
          </MapContainer>
        </div>
      </div>

      <div className="card mb-6 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Notas internas (no visibles para el ciudadano)</h2>
        <textarea
          value={adminNotes}
          onChange={(e) => {
            setAdminNotes(e.target.value);
            setNotesSaved(false);
          }}
          rows={3}
          maxLength={1000}
          className="input"
          placeholder="Ej: se coordinó recojo con voluntario Juan, animal ya en tránsito a la clínica…"
        />
        <div className="flex items-center gap-3">
          <button onClick={() => void handleSaveNotes()} disabled={saving} className="btn-secondary">
            {saving ? "Guardando…" : "Guardar notas"}
          </button>
          {notesSaved && <span className="text-sm font-medium text-emerald-600">Notas guardadas ✓</span>}
          <span className="ml-auto text-xs text-slate-400">{adminNotes.length}/1000</span>
        </div>
        <InlineError message={notesError} />
      </div>

      {actions.length > 0 && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Acciones</h2>
          <div className="flex flex-wrap gap-3">
            {actions.map((action) =>
              action.next === "RECHAZADO" ? (
                <button key={action.next} disabled={saving} onClick={() => setShowRejectForm(true)} className={action.style}>
                  {action.label}
                </button>
              ) : (
                <button key={action.next} disabled={saving} onClick={() => void handleTransition(action.next)} className={action.style}>
                  {saving ? "Guardando…" : action.label}
                </button>
              )
            )}
          </div>

          {showRejectForm && (
            <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4">
              <label className="text-sm font-medium text-slate-600">Motivo del rechazo (se le mostrará al ciudadano)</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                maxLength={500}
                className="input"
                placeholder="Ej: información insuficiente para ubicar al animal…"
              />
              <div className="flex items-center gap-2">
                <button
                  disabled={saving || !rejectionReason.trim()}
                  onClick={() => void handleTransition("RECHAZADO", rejectionReason)}
                  className="btn-primary !bg-rose-600 hover:!bg-rose-700"
                >
                  Confirmar rechazo
                </button>
                <button onClick={() => setShowRejectForm(false)} className="btn-secondary">Cancelar</button>
                <span className="ml-auto text-xs text-slate-400">{rejectionReason.length}/500</span>
              </div>
            </div>
          )}

          <div className="mt-4">
            <InlineError message={actionError} />
          </div>
        </div>
      )}
    </div>
  );
}
