import type { ReportStatus } from "../types";

const STYLES: Record<ReportStatus, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800 ring-amber-200",
  APROBADO: "bg-sky-100 text-sky-800 ring-sky-200",
  EN_PROCESO: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  RESCATADO: "bg-brand-100 text-brand-800 ring-brand-200",
  RECHAZADO: "bg-rose-100 text-rose-800 ring-rose-200",
};

const LABELS: Record<ReportStatus, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  EN_PROCESO: "En proceso",
  RESCATADO: "Rescatado",
  RECHAZADO: "Rechazado",
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
