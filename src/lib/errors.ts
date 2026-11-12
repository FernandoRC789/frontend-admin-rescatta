import { ApiError } from "../api/client";

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};

  const raw = error.fieldErrors;
  if (Array.isArray(raw)) {
    const result: Record<string, string> = {};
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      if (typeof record.field === "string" && typeof record.reason === "string") {
        result[record.field] = record.reason;
      }
    }
    return result;
  }

  if (raw && typeof raw === "object") {
    const result: Record<string, string> = {};
    for (const [field, reason] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof reason === "string") result[field] = reason;
    }
    return result;
  }

  return {};
}

export function formatErrorWithFields(error: unknown, fallback: string): string {
  const message = getErrorMessage(error, fallback);
  const fieldMessages = Object.values(getFieldErrors(error));
  return fieldMessages.length > 0 ? `${message} ${fieldMessages.join(" ")}` : message;
}
