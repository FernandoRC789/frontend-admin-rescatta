import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { Upload } from "lucide-react";
import { fetchMyOrganization, updateMyOrganization, uploadMyOrganizationLogo } from "../api/organizationsApi";
import type { OrganizationResponse } from "../types";
import ErrorState, { InlineError } from "../components/ErrorState";
import LocationPicker from "../components/LocationPicker";
import { formatErrorWithFields } from "../lib/errors";
import { handleImageError, resolveImageUrl } from "../lib/imageUrl";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const MAX_LOGO_BYTES = 10 * 1024 * 1024;

export default function ProfilePage() {
  const [org, setOrg] = useState<OrganizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchMyOrganization();
      if (requestId !== requestIdRef.current) return;
      setOrg(data);
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setLoadError(formatErrorWithFields(error, "No se pudo cargar el perfil de la organización."));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  useEffect(() => {
    if (!saved) return;
    const timeout = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  const set = <K extends keyof OrganizationResponse>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setOrg((o) => (o ? { ...o, [field]: e.target.value } : o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;

    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      const updated = await updateMyOrganization({
        name: org.name,
        type: org.type,
        description: org.description,
        address: org.address ?? "",
        district: org.district,
        latitude: org.latitude,
        longitude: org.longitude,
        phone: org.phone,
        email: org.email,
        website: org.website,
        scheduleText: org.scheduleText,
        emergency24h: org.emergency24h,
      });
      setOrg(updated);
      setSaved(true);
    } catch (error) {
      setSaveError(formatErrorWithFields(error, "No se pudieron guardar los cambios."));
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setUploadError(null);
    const allowedByName = /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
    if (!ALLOWED_IMAGE_TYPES.has(file.type) && !allowedByName) {
      setUploadError("Formato no permitido. Usa JPG, PNG, WebP, HEIC o HEIF.");
      input.value = "";
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setUploadError("El logo no puede superar los 10 MB.");
      input.value = "";
      return;
    }

    setUploading(true);
    try {
      const updated = await uploadMyOrganizationLogo(file);
      setOrg(updated);
    } catch (error) {
      setUploadError(formatErrorWithFields(error, "No se pudo subir el logo."));
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  if (loading) {
    return <p className="p-8 text-center text-sm text-slate-400">Cargando…</p>;
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <ErrorState message={loadError} onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="mx-auto max-w-4xl p-8">
        <ErrorState message="No se encontró la organización." onRetry={() => setReloadKey((key) => key + 1)} />
      </div>
    );
  }

  const center: [number, number] = [org.latitude ?? -12.046374, org.longitude ?? -77.042793];

  return (
    <div className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Mi organización</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card flex items-center gap-6">
          <img
            src={resolveImageUrl(org.logoUrl)}
            alt="Logo"
            onError={handleImageError}
            className="h-24 w-24 rounded-2xl object-cover ring-1 ring-slate-100"
          />
          <div>
            <label className={`btn-secondary flex w-fit cursor-pointer items-center gap-2 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
              <Upload className="h-4 w-4" />
              {uploading ? "Subiendo…" : "Cambiar logo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => void handleLogoUpload(e)}
              />
            </label>
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              {org.verified ? (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-700">
                  ✓ Organización verificada
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                  Pendiente de verificación
                </span>
              )}
            </p>
            <div className="mt-2">
              <InlineError message={uploadError} />
            </div>
          </div>
        </div>

        <div className="card grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-600">Nombre</label>
            <input required value={org.name} onChange={set("name")} className="input" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Tipo</label>
            <select value={org.type ?? "REFUGIO"} onChange={set("type")} className="input">
              <option value="REFUGIO">Refugio</option>
              <option value="VETERINARIA">Veterinaria</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Distrito</label>
            <input value={org.district ?? ""} onChange={set("district")} className="input" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-600">Descripción</label>
            <textarea rows={3} value={org.description ?? ""} onChange={set("description")} className="input" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-600">Dirección</label>
            <input required value={org.address ?? ""} onChange={set("address")} className="input" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Teléfono</label>
            <input value={org.phone ?? ""} onChange={set("phone")} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Email de contacto</label>
            <input type="email" value={org.email ?? ""} onChange={set("email")} className="input" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Sitio web</label>
            <input value={org.website ?? ""} onChange={set("website")} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Horario de atención</label>
            <input placeholder="Lun-Vie 9:00-18:00" value={org.scheduleText ?? ""} onChange={set("scheduleText")} className="input" />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
            <input
              type="checkbox"
              checked={org.emergency24h}
              onChange={(e) => setOrg((o) => (o ? { ...o, emergency24h: e.target.checked } : o))}
            />
            Atendemos emergencias 24 horas
          </label>
        </div>

        <div className="card !p-0 overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-3 text-sm text-slate-500">
            Toca el mapa para ajustar la ubicación exacta (se muestra a los ciudadanos en la app).
          </div>
          <MapContainer center={center} zoom={14} style={{ height: 320 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
            {org.latitude != null && org.longitude != null && <Marker position={[org.latitude, org.longitude]} />}
            <LocationPicker onPick={(lat, lng) => setOrg((o) => (o ? { ...o, latitude: lat, longitude: lng } : o))} />
          </MapContainer>
        </div>

        <div className="space-y-3">
          <InlineError message={saveError} />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
            {saved && <span className="text-sm font-medium text-emerald-600">Guardado ✓</span>}
          </div>
        </div>
      </form>
    </div>
  );
}
