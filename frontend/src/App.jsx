import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuthStore from "./store/authStore";

// Layouts
import DashboardLayout from "./components/layout/DashboardLayout";
import PublicLayout from "./components/layout/PublicLayout";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Shared pages
import PropertiesPage from "./pages/properties/PropertiesPage";
import PropertyDetailPage from "./pages/properties/PropertyDetailPage";

// Investor pages
import InvestorDashboard from "./pages/investor/InvestorDashboard";
import PortfolioPage from "./pages/investor/PortfolioPage";
import TransactionHistoryPage from "./pages/investor/TransactionHistoryPage";

// Property Owner pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import AddPropertyPage from "./pages/owner/AddPropertyPage";
import MyPropertiesPage from "./pages/owner/MyPropertiesPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminPropertiesPage from "./pages/admin/AdminPropertiesPage";
import AdminTransactionsPage from "./pages/admin/AdminTransactionsPage";

// Guards
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleRoute from "./components/auth/RoleRoute";

export default function App() {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/properties/:id" element={<PropertyDetailPage />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Investor routes */}
          <Route element={<RoleRoute roles={["investor"]} />}>
            <Route path="/dashboard" element={<InvestorDashboard />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/transactions" element={<TransactionHistoryPage />} />
          </Route>

          {/* Property Owner routes */}
          <Route element={<RoleRoute roles={["property_owner"]} />}>
            <Route path="/owner/dashboard" element={<OwnerDashboard />} />
            <Route path="/owner/properties" element={<MyPropertiesPage />} />
            <Route path="/owner/add-property" element={<AddPropertyPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<RoleRoute roles={["admin"]} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/properties" element={<AdminPropertiesPage />} />
            <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
          </Route>

          {/* Shared protected routes */}
          <Route path="/marketplace" element={<PropertiesPage />} />
          <Route path="/marketplace/:id" element={<PropertyDetailPage />} />
        </Route>
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
