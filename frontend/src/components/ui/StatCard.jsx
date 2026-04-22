import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendValue, color = "blue" }) {
  const colorMap = {
    blue: "text-primary-400 bg-primary-500/10",
    green: "text-emerald-400 bg-emerald-500/10",
    gold: "text-gold-400 bg-gold-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    red: "text-red-400 bg-red-500/10",
  };

  return (
    <div className="stat-card animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trendValue !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-emerald-400" : "text-red-400"}`}>
          {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>
  );
}
