import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Layout from "./components/Layout";

import LoginPage from "./pages/LoginPage";
import RegisterOrgPage from "./pages/RegisterOrgPage";
import PendingVerificationPage from "./pages/PendingVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ReportsPage from "./pages/ReportsPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import ChatsPage from "./pages/ChatsPage";
import ProfilePage from "./pages/ProfilePage";
import SuperAdminOrganizationsPage from "./pages/SuperAdminOrganizationsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registrar-organizacion" element={<RegisterOrgPage />} />
          <Route path="/pendiente-verificacion" element={<PendingVerificationPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/reportes" element={<ReportsPage />} />
              <Route path="/reportes/:id" element={<ReportDetailPage />} />
              <Route path="/chats" element={<ChatsPage />} />
              <Route path="/perfil" element={<ProfilePage />} />
              <Route
                path="/rescatta-admin/organizaciones"
                element={
                  <RoleRoute allowed={["SUPERADMIN"]}>
                    <SuperAdminOrganizationsPage />
                  </RoleRoute>
                }
              />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
