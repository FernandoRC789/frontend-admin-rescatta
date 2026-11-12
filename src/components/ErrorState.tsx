import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function ErrorState({ message, onRetry, compact = false }: ErrorStateProps) {
  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
        <span>{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="font-semibold underline">
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertCircle className="h-5 w-5" />
      </div>
      <p className="max-w-md text-sm text-slate-600">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Reintentar
        </button>
      )}
    </div>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>;
}
