import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, ClipboardList, MessageCircle, Building2, LogOut, PawPrint, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/reportes", label: "Reportes", icon: ClipboardList },
  { to: "/chats", label: "Chat", icon: MessageCircle },
  { to: "/perfil", label: "Mi organización", icon: Building2 },
];

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-6 py-5">
          <PawPrint className="h-7 w-7 text-brand-600" />
          <div>
            <p className="text-lg font-bold text-slate-800 leading-none">Rescatta</p>
            <p className="text-xs text-slate-400">Panel administrador</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}

          {profile?.role === "SUPERADMIN" && (
            <NavLink
              to="/rescatta-admin/organizaciones"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              <ShieldCheck className="h-5 w-5" />
              Verificar organizaciones
            </NavLink>
          )}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <p className="truncate text-sm font-medium text-slate-700">
            {profile?.displayName || profile?.email || "Administrador"}
          </p>
          <p className="truncate text-xs text-slate-400">{profile?.organizationName ?? "Sin organización"}</p>
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
