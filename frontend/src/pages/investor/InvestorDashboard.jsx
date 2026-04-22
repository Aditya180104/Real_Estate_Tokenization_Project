import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Briefcase, TrendingUp, DollarSign, Activity,
  ArrowRight, Wallet, ShieldCheck, Bell,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import useWalletStore from "../../store/walletStore";
import StatCard from "../../components/ui/StatCard";
import PropertyCard from "../../components/ui/PropertyCard";
import { PageLoader } from "../../components/ui/LoadingSpinner";

const mockChartData = [
  { month: "Aug", value: 4200 },
  { month: "Sep", value: 5800 },
  { month: "Oct", value: 5200 },
  { month: "Nov", value: 7100 },
  { month: "Dec", value: 6800 },
  { month: "Jan", value: 9200 },
];

export default function InvestorDashboard() {
  const { user } = useAuthStore();
  const { isConnected, address, balance, connect } = useWalletStore();

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const { data } = await api.get("/transactions/portfolio");
      return data.data;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: async () => {
      const { data } = await api.get("/transactions/my-transactions?limit=5");
      return data.data;
    },
  });

  const { data: featuredProperties } = useQuery({
    queryKey: ["featured-properties"],
    queryFn: async () => {
      const { data } = await api.get("/properties?featured=true&limit=3&status=active");
      return data.data;
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=5");
      return data;
    },
  });

  if (portfolioLoading) return <PageLoader />;

  const totalValue = portfolio?.totalValue || 0;
  const propertyCount = portfolio?.properties?.length || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Here's your investment overview</p>
        </div>
        <Link to="/marketplace" className="btn-primary flex items-center gap-2 text-sm">
          Browse Properties
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KYC / Wallet alerts */}
      {user?.kycStatus !== "verified" && (
        <div className="card p-4 border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-400">KYC Verification Required</p>
              <p className="text-xs text-slate-500">Complete identity verification to start investing</p>
            </div>
          </div>
          <span className="badge-yellow capitalize">{user?.kycStatus}</span>
        </div>
      )}

      {!isConnected && (
        <div className="card p-4 border-primary-500/30 bg-primary-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary-400">Connect Your Wallet</p>
              <p className="text-xs text-slate-500">Link MetaMask to buy shares and receive revenue</p>
            </div>
          </div>
          <button onClick={connect} className="btn-primary text-sm py-2 px-4">
            Connect MetaMask
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Value"
          value={`$${totalValue.toLocaleString()}`}
          icon={DollarSign}
          color="blue"
          trend="up"
          trendValue="+12.4% this month"
        />
        <StatCard
          title="Properties Owned"
          value={propertyCount}
          icon={Briefcase}
          color="gold"
          subtitle="Across all markets"
        />
        <StatCard
          title="Total Returns"
          value="$0"
          icon={TrendingUp}
          color="green"
          subtitle="Lifetime earnings"
        />
        <StatCard
          title="Wallet Balance"
          value={isConnected ? `${parseFloat(balance).toFixed(4)} ETH` : "—"}
          icon={Wallet}
          color="purple"
          subtitle={isConnected ? address?.slice(0, 10) + "..." : "Not connected"}
        />
      </div>

      {/* Chart + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio chart */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Portfolio Growth</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#f1f5f9" }}
                formatter={(v) => [`$${v}`, "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Notifications</h2>
            {notifications?.unreadCount > 0 && (
              <span className="badge-red">{notifications.unreadCount} new</span>
            )}
          </div>
          <div className="space-y-3">
            {notifications?.data?.length > 0 ? (
              notifications.data.slice(0, 4).map((n) => (
                <div key={n._id} className={`p-3 rounded-xl text-sm ${n.isRead ? "bg-slate-800/50" : "bg-primary-500/10 border border-primary-500/20"}`}>
                  <p className="font-medium text-slate-300 text-xs">{n.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-600 text-sm text-center py-4">No notifications</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      {transactions?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx._id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    tx.transactionType === "purchase" ? "bg-emerald-500/10" : "bg-red-500/10"
                  }`}>
                    <Activity className={`w-4 h-4 ${tx.transactionType === "purchase" ? "text-emerald-400" : "text-red-400"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">{tx.property?.title || "Property"}</p>
                    <p className="text-xs text-slate-500 capitalize">{tx.transactionType} · {tx.shares} shares</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.transactionType === "purchase" ? "text-red-400" : "text-emerald-400"}`}>
                    {tx.transactionType === "purchase" ? "-" : "+"}${tx.amountUSD?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured properties */}
      {featuredProperties?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Featured Properties</h2>
            <Link to="/marketplace" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((p) => (
              <PropertyCard key={p._id} property={p} linkPrefix="/marketplace" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
