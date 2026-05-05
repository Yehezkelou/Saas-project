// src/App.tsx

import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore, useTableStore, usePosStore } from "./stores";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Client QR
import { QrScanPage }       from "./pages/client/QrScanPage";
import { MenuPage }         from "./pages/client/MenuPage";
import { CartPage }         from "./pages/client/CartPage";
import { ConfirmationPage } from "./pages/client/ConfirmPage";

// POS Staff
import { StaffLoginPage } from "./pages/staff/StaffLoginPage";
import { TablesPage }    from "./pages/pos/TablesPage";
import { OrderPage }     from "./pages/pos/OrderPage";
import { PaymentPage }   from "./pages/pos/PaymentPage";
import { KitchenPage }     from "./pages/pos/KitchenPage";
import { OrderManagementPage } from "./pages/pos/OrderManagementPage";
import { CyclePage }     from "./pages/pos/CyclePage";
import { PosLayout }     from "./pages/pos/PosLayout";

// Admin
import { AdminLayout }          from "./pages/admin/AdminLayout";
import { LoginPage }            from "./pages/admin/LoginPage";
import { RegisterPage }         from "./pages/admin/RegisterPage";
import { DashboardPage }        from "./pages/admin/DashboardPage";
import { MenuManagerPage }      from "./pages/admin/MenuManagerPage";
import { StaffPage }            from "./pages/admin/StaffPage";
import { TablesManagerPage }    from "./pages/admin/TablesManagerPage";
import { ReportsPage }          from "./pages/admin/ReportsPage";
import { SubscriptionPage }     from "./pages/admin/SubscriptionPage";
import { SuperAdminPage }       from "./pages/admin/SuperAdminPage";
import { PendingVerificationPage } from "./pages/admin/PendingVerificationPage";
import { SuperAdminLoginPage }  from "./pages/admin/SuperAdminLoginPage";

// ── Guards ─────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);
  const location = useLocation();
  const isLoggedIn = !!user;

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  // LOGIQUE SUPER ADMIN
  if (user?.role === "SUPERADMIN") {
    // Si le Super Admin est sur une page de restaurant, on le redirige vers son centre de contrôle
    // Sauf s'il est déjà sur /super-admin
    if (location.pathname !== "/super-admin") {
       return <Navigate to="/super-admin" replace />;
    }
    return <>{children}</>;
  }

  // LOGIQUE ADMIN / MANAGER
  // Si l'abonnement est en attente, on bloque l'accès aux pages admin
  if (tenant?.subscription?.status === "PENDING") {
    return <Navigate to="/pending-verification" replace />;
  }

  return <>{children}</>;
}

function RequireTableSession({ children }: { children: React.ReactNode }) {
  const hasSession = useTableStore((s) => s.hasSession());
  return hasSession ? <>{children}</> : <Navigate to="/scan" replace />;
}

function RequireStaffSession({ children }: { children: React.ReactNode }) {
  const isLoggedIn = usePosStore((s) => s.isLoggedIn());
  return isLoggedIn ? <>{children}</> : <Navigate to="/pos" replace />;
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "PLACEHOLDER_GOOGLE_CLIENT_ID"}>
      <Routes>
        {/* ── Client QR ── */}
        <Route path="/scan"            element={<QrScanPage />} />
        <Route path="/scan/:qrToken"   element={<QrScanPage />} />
        <Route path="/menu"            element={<RequireTableSession><MenuPage /></RequireTableSession>} />
        <Route path="/cart"            element={<RequireTableSession><CartPage /></RequireTableSession>} />
        <Route path="/confirmation/:orderId" element={<RequireTableSession><ConfirmationPage /></RequireTableSession>} />

        {/* ── POS Staff ── */}
        <Route path="/pos"             element={<StaffLoginPage />} />
        <Route element={<RequireStaffSession><PosLayout /></RequireStaffSession>}>
          <Route path="/pos/tables"      element={<TablesPage />} />
          <Route path="/pos/order/:tableId" element={<OrderPage />} />
          <Route path="/pos/payment/:orderId" element={<PaymentPage />} />
          <Route path="/pos/kitchen"     element={<OrderManagementPage />} />
          <Route path="/pos/kds"         element={<KitchenPage />} />
          <Route path="/pos/cycle"       element={<CyclePage />} />
        </Route>

        {/* ── Admin ── */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/system/login" element={<SuperAdminLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pending-verification" element={<PendingVerificationPage />} />
        
        <Route path="/" element={<RequireAuth><AdminLayout /></RequireAuth>}>
          <Route index                element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"     element={<DashboardPage />} />
          <Route path="menu-manager"  element={<MenuManagerPage />} />
          <Route path="staff"         element={<StaffPage />} />
          <Route path="tables-manager" element={<TablesManagerPage />} />
          <Route path="reports"       element={<ReportsPage />} />
          <Route path="subscription"  element={<SubscriptionPage />} />
          <Route path="super-admin"   element={<SuperAdminPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </GoogleOAuthProvider>
  );
}