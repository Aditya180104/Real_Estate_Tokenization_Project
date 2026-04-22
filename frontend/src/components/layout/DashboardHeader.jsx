import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, Bell, Wallet, RefreshCw } from "lucide-react";
import useAuthStore from "../../store/authStore";
import useWalletStore from "../../store/walletStore";
import api from "../../services/api";

export default function DashboardHeader({ onMenuClick }) {
  const { user } = useAuthStore();
  const { address, balance, isConnected, connect, disconnect } = useWalletStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get("/notifications?unreadOnly=true&limit=1");
        setUnreadCount(data.unreadCount || 0);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-slate-400 hover:text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className="flex-1 lg:flex-none" />

      <div className="flex items-center gap-3">
        {/* Wallet */}
        {isConnected ? (
          <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-mono">{shortAddress}</span>
            <span className="text-xs text-slate-500">|</span>
            <span className="text-xs text-slate-300">{parseFloat(balance).toFixed(4)} ETH</span>
            <button
              onClick={disconnect}
              className="text-slate-500 hover:text-red-400 transition-colors ml-1"
              title="Disconnect wallet"
            >
              ×
            </button>
          </div>
        ) : (
          <button
            onClick={connect}
            className="hidden sm:flex items-center gap-2 bg-primary-600/20 border border-primary-500/30 text-primary-400 hover:bg-primary-600/30 rounded-xl px-3 py-2 text-xs font-medium transition-all"
          >
            <Wallet className="w-3.5 h-3.5" />
            Connect Wallet
          </button>
        )}

        {/* Notifications */}
        <Link
          to={user?.role === "admin" ? "/admin/dashboard" : user?.role === "property_owner" ? "/owner/dashboard" : "/dashboard"}
          className="relative p-2 text-slate-400 hover:text-white transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white font-bold">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
