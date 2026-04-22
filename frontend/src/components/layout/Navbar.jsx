import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Menu, X, ChevronDown } from "lucide-react";
import useAuthStore from "../../store/authStore";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return "/login";
    const map = { admin: "/admin/dashboard", property_owner: "/owner/dashboard", investor: "/dashboard" };
    return map[user.role] || "/dashboard";
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-gold-500 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">PropToken</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/properties" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
              Properties
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  Dashboard
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <button onClick={handleLogout} className="btn-secondary text-sm py-2 px-4">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-slate-400 hover:text-white transition-colors text-sm font-medium">
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2">
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800 space-y-3 animate-fade-in">
            <Link to="/properties" className="block text-slate-400 hover:text-white py-2 text-sm">
              Properties
            </Link>
            {isAuthenticated ? (
              <>
                <Link to={getDashboardPath()} className="block text-slate-400 hover:text-white py-2 text-sm">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="block text-red-400 hover:text-red-300 py-2 text-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block text-slate-400 hover:text-white py-2 text-sm">
                  Login
                </Link>
                <Link to="/register" className="block btn-primary text-sm text-center">
                  Get Started
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
