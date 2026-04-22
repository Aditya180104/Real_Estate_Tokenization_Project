import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Briefcase, TrendingUp, DollarSign, Percent, ArrowRight, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import api from "../../services/api";
import useWalletStore from "../../store/walletStore";
import StatCard from "../../components/ui/StatCard";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function PortfolioPage() {
  const { isConnected, connect } = useWalletStore();

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async () => {
      const { data } = await api.get("/transactions/portfolio");
      return data.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const properties = data?.properties || [];
  const totalValue = data?.totalValue || 0;

  const pieData = properties.map((p, i) => ({
    name: p.title,
    value: p.shares * p.financials?.pricePerShare || 0,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">My Portfolio</h1>
        <p className="text-slate-500 mt-1 text-sm">Track your fractional property investments</p>
      </div>

      {!isConnected && (
        <div className="card p-5 border-primary-500/30 bg-primary-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-primary-400" />
            <p className="text-sm text-primary-400 font-medium">Connect wallet to see on-chain balances</p>
          </div>
          <button onClick={connect} className="btn-primary text-sm py-2 px-4">Connect</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Portfolio Value" value={`$${totalValue.toLocaleString()}`} icon={DollarSign} color="blue" />
        <StatCard title="Properties Owned" value={properties.length} icon={Briefcase} color="gold" />
        <StatCard title="Avg. Annual Return" value="8.5%" icon={TrendingUp} color="green" />
      </div>

      {properties.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No investments yet"
          description="Browse the marketplace and purchase shares to start building your portfolio."
          action={
            <Link to="/marketplace" className="btn-primary flex items-center gap-2">
              Browse Properties <ArrowRight className="w-4 h-4" />
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Allocation chart */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Allocation</h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#f1f5f9" }}
                  formatter={(v) => [`$${v.toLocaleString()}`, "Value"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Holdings table */}
          <div className="lg:col-span-2 card p-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Holdings</h2>
            <div className="space-y-3">
              {properties.map((prop, i) => {
                const holdingValue = prop.shares * prop.financials?.pricePerShare || 0;
                const allocationPct = totalValue > 0 ? ((holdingValue / totalValue) * 100).toFixed(1) : 0;

                return (
                  <Link
                    key={prop._id}
                    to={`/marketplace/${prop._id}`}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-primary-400 transition-colors">
                        {prop.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {prop.location?.city} · {prop.shares} shares · {(prop.ownershipPercentage / 100).toFixed(2)}% ownership
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-slate-100">${holdingValue.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{allocationPct}% of portfolio</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
