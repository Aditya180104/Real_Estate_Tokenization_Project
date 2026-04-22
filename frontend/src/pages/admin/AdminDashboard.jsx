import { useQuery } from "@tanstack/react-query";
import { Users, Building2, Activity, DollarSign, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../../services/api";
import StatCard from "../../components/ui/StatCard";
import { PageLoader } from "../../components/ui/LoadingSpinner";

const mockMonthlyData = [
  { month: "Aug", properties: 3, users: 12 },
  { month: "Sep", properties: 5, users: 28 },
  { month: "Oct", properties: 4, users: 35 },
  { month: "Nov", properties: 8, users: 52 },
  { month: "Dec", properties: 6, users: 41 },
  { month: "Jan", properties: 11, users: 67 },
];

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/admin/dashboard");
      return data.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const { stats, usersByRole, recentUsers, recentProperties } = data || {};

  const roleMap = { admin: 0, property_owner: 0, investor: 0 };
  usersByRole?.forEach(({ _id, count }) => { roleMap[_id] = count; });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Platform overview and management</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="blue"
          subtitle={`${roleMap.investor} investors · ${roleMap.property_owner} owners`} />
        <StatCard title="Total Properties" value={stats?.totalProperties || 0} icon={Building2} color="gold"
          subtitle={`${stats?.activeProperties || 0} active`} />
        <StatCard title="Pending Review" value={stats?.pendingProperties || 0} icon={Clock} color="purple"
          subtitle="Awaiting verification" />
        <StatCard title="Total Transactions" value={stats?.totalTransactions || 0} icon={Activity} color="green"
          subtitle={`$${(stats?.totalVolume || 0).toLocaleString()} volume`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">Monthly Growth</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={mockMonthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "12px", color: "#f1f5f9" }} />
              <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Users" />
              <Bar dataKey="properties" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Properties" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User breakdown */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-6">User Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: "Investors", count: roleMap.investor, color: "bg-primary-500", total: stats?.totalUsers },
              { label: "Property Owners", count: roleMap.property_owner, color: "bg-gold-500", total: stats?.totalUsers },
              { label: "Admins", count: roleMap.admin, color: "bg-purple-500", total: stats?.totalUsers },
            ].map(({ label, count, color, total }) => {
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-300 font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers?.map((user) => (
              <div key={user._id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-300 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`badge capitalize ${user.role === "admin" ? "badge-red" : user.role === "property_owner" ? "badge-blue" : "badge-green"}`}>
                    {user.role?.replace("_", " ")}
                  </span>
                  <span className={`badge ${user.kycStatus === "verified" ? "badge-green" : "badge-yellow"}`}>
                    {user.kycStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent properties */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-100">Recent Properties</h2>
            <Link to="/admin/properties" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentProperties?.map((prop) => (
              <div key={prop._id} className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                  {prop.images?.[0] ? (
                    <img src={prop.images[0].url} alt="" className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-slate-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-300 truncate">{prop.title}</p>
                  <p className="text-xs text-slate-500">{prop.owner?.firstName} {prop.owner?.lastName}</p>
                </div>
                <span className={`badge ${prop.status === "active" ? "badge-green" : prop.status === "pending_review" ? "badge-yellow" : "badge-gray"}`}>
                  {prop.status?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
