import { NavLink, useNavigate } from "react-router-dom";
import {
  Building2, LayoutDashboard, Briefcase, History, Plus,
  List, Users, Settings, LogOut, X, ShieldCheck, BarChart3,
  Home, TrendingUp,
} from "lucide-react";
import useAuthStore from "../../store/authStore";

const navConfig = {
  investor: [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/portfolio", icon: Briefcase, label: "My Portfolio" },
    { to: "/marketplace", icon: Building2, label: "Marketplace" },
    { to: "/transactions", icon: History, label: "Transactions" },
  ],
  property_owner: [
    { to: "/owner/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/owner/properties", icon: List, label: "My Properties" },
    { to: "/owner/add-property", icon: Plus, label: "Add Property" },
    { to: "/marketplace", icon: Building2, label: "Marketplace" },
  ],
  admin: [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/properties", icon: Building2, label: "Properties" },
    { to: "/admin/transactions", icon: BarChart3, label: "Transactions" },
  ],
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const navItems = navConfig[user?.role] || [];

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleLabel = {
    admin: "Administrator",
    property_owner: "Property Owner",
    investor: "Investor",
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800
          flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-gold-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">PropToken</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">{roleLabel[user?.role]}</p>
            </div>
          </div>
          {user?.kycStatus === "verified" && (
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
              <ShieldCheck className="w-3 h-3" />
              KYC Verified
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary-600/20 text-primary-400 border border-primary-500/30"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
