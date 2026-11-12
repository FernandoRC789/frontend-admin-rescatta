import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { PawPrint } from "lucide-react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import LocationPicker from "../components/LocationPicker";
import { formatErrorWithFields } from "../lib/errors";

interface FormState {
  name: string;
  type: "VETERINARIA" | "REFUGIO";
  address: string;
  district: string;
  phone: string;
  email: string;
  password: string;
  scheduleText: string;
}

const INITIAL: FormState = {
  name: "",
  type: "REFUGIO",
  address: "",
  district: "",
  phone: "",
  email: "",
  password: "",
  scheduleText: "",
};

export default function RegisterOrgPage() {
  const navigate = useNavigate();
  const { firebaseUser, refreshProfile } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Si no hay sesión, primero se crea la cuenta de Firebase (o se usa la ya iniciada).
      if (!firebaseUser) {
        try {
          await createUserWithEmailAndPassword(auth, form.email, form.password);
        } catch (createError) {
          const code = (createError as { code?: string }).code;
          if (code !== "auth/email-already-in-use") throw createError;
          await signInWithEmailAndPassword(auth, form.email, form.password);
        }
      }

      const contactEmail = firebaseUser?.email ?? form.email;

      await api.post("/api/v1/organizations/register", {
        name: form.name,
        type: form.type,
        address: form.address,
        district: form.district,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
        phone: form.phone,
        email: contactEmail || null,
        scheduleText: form.scheduleText,
        emergency24h: false,
      });

      await refreshProfile();
      navigate("/pendiente-verificacion");
    } catch (err) {
      setError(formatErrorWithFields(err, "No se pudo completar el registro."));
    } finally {
      setSubmitting(false);
    }
  };

  const center: [number, number] = location
    ? [location.lat, location.lng]
    : [-12.046374, -77.042793];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <div className="mb-6 flex flex-col items-center gap-2">
          <PawPrint className="h-10 w-10 text-brand-600" />
          <h1 className="text-xl font-bold text-slate-800">Registra tu veterinaria o refugio</h1>
          <p className="text-center text-sm text-slate-400">
            Tras registrarte, el equipo de Rescatta validará tu organización antes de darte acceso completo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-600">Nombre de la organización</label>
            <input required value={form.name} onChange={set("name")} className="input" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Tipo</label>
            <select value={form.type} onChange={set("type")} className="input">
              <option value="REFUGIO">Refugio</option>
              <option value="VETERINARIA">Veterinaria</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Distrito</label>
            <input value={form.district} onChange={set("district")} className="input" />
          </div>

          <div className="col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-600">Dirección</label>
            <input required value={form.address} onChange={set("address")} className="input" />
          </div>

          <div className="col-span-2 overflow-hidden rounded-xl ring-1 ring-slate-100">
            <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
              Toca el mapa para marcar la ubicación de tu organización.
            </div>
            <MapContainer center={center} zoom={14} style={{ height: 240 }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
              {location && <Marker position={[location.lat, location.lng]} />}
              <LocationPicker onPick={(lat, lng) => setLocation({ lat, lng })} />
            </MapContainer>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Teléfono</label>
            <input required value={form.phone} onChange={set("phone")} className="input" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Horario</label>
            <input placeholder="Lun-Vie 9:00-18:00" value={form.scheduleText} onChange={set("scheduleText")} className="input" />
          </div>

          {firebaseUser ? (
            <p className="col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              Registrando con la cuenta <span className="font-medium text-slate-700">{firebaseUser.email}</span>.
            </p>
          ) : (
            <>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-600">Correo de acceso</label>
                <input type="email" required value={form.email} onChange={set("email")} className="input" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-600">Contraseña</label>
                <input type="password" required minLength={6} value={form.password} onChange={set("password")} className="input" />
              </div>
            </>
          )}

          {error && <p className="col-span-2 text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="col-span-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {submitting ? "Registrando…" : "Registrar organización"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
