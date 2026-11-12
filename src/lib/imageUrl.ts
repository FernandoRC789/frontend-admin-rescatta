import type { SyntheticEvent } from "react";
import { API_BASE_URL } from "./env";

const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <rect width="128" height="128" rx="24" fill="#f1f5f9"/>
    <text x="64" y="78" text-anchor="middle" font-size="48">🐾</text>
  </svg>`
)}`;

/**
 * Las imágenes nuevas viven en Cloudinary y llegan como URLs absolutas.
 * Las imágenes antiguas o de desarrollo pueden llegar como /uploads/...
 * En ese caso hay que apuntarlas al backend, no al origen del frontend.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return FALLBACK_IMAGE;

  const value = url.trim();
  if (!value) return FALLBACK_IMAGE;

  if (/^(https?:)?\/\//i.test(value) || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  return `${API_BASE_URL}${value.startsWith("/") ? "" : "/"}${value}`;
}

export function handleImageError(event: SyntheticEvent<HTMLImageElement>): void {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === "true") return;

  image.dataset.fallbackApplied = "true";
  image.src = FALLBACK_IMAGE;
}
