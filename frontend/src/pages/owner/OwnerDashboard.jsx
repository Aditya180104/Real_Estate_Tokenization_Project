import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Building2, TrendingUp, DollarSign, Plus, ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import StatCard from "../../components/ui/StatCard";
import { PageLoader } from "../../components/ui/LoadingSpinner";

const statusConfig = {
  active: { label: "Active", icon: CheckCircle, color: "text-emerald-400" },
  pending_review: { label: "Pending Review", icon: Clock, color: "text-amber-400" },
  verified: { label: "Verified", icon: CheckCircle, color: "text-blue-400" },
  draft: { label: "Draft", icon: Clock, color: "text-slate-400" },
  suspended: { label: "Suspended", icon: XCircle, color: "text-red-400" },
};

export default function OwnerDashboard() {
  const { user } = useAuthStore();

  const { data: properties, isLoading } = useQuery({
    queryKey: ["owner-properties"],
    queryFn: async () => {
      const { data } = await api.get("/properties/owner/my-properties");
      return data.data;
    },
  });

  if (isLoading) return <PageLoader />;

  const activeCount = properties?.filter((p) => p.status === "active").length || 0;
  const pendingCount = properties?.filter((p) => p.status === "pending_review").length || 0;
  const totalValue = properties?.reduce((sum, p) => sum + (p.financials?.totalValue || 0), 0) || 0;
  const tokenizedCount = properties?.filter((p) => p.tokenization?.isTokenized).length || 0;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Owner Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your tokenized properties</p>
        </div>
        <Link to="/owner/add-property" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Property
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Properties" value={properties?.length || 0} icon={Building2} color="blue" />
        <StatCard title="Active & Trading" value={activeCount} icon={TrendingUp} color="green" />
        <StatCard title="Pending Review" value={pendingCount} icon={Clock} color="gold" />
        <StatCard title="Total Portfolio Value" value={`$${(totalValue / 1000000).toFixed(2)}M`} icon={DollarSign} color="purple" />
      </div>

      {/* Properties list */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100">My Properties</h2>
          <Link to="/owner/properties" className="text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {properties?.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 font-medium mb-1">No properties yet</p>
            <p className="text-slate-600 text-sm mb-4">Add your first property to start tokenizing</p>
            <Link to="/owner/add-property" className="btn-primary text-sm">
              Add Property
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {properties?.slice(0, 5).map((prop) => {
              const cfg = statusConfig[prop.status] || statusConfig.draft;
              const StatusIcon = cfg.icon;
              return (
                <Link
                  key={prop._id}
                  to={`/marketplace/${prop._id}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                    {prop.images?.[0] ? (
                      <img src={prop.images[0].url} alt="" className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate group-hover:text-primary-400 transition-colors">
                      {prop.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {prop.location?.city}, {prop.location?.country} · {prop.financials?.totalShares?.toLocaleString()} shares
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusIcon className={`w-4 h-4 ${cfg.color}`} />
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-slate-100">${(prop.financials?.totalValue / 1000000).toFixed(2)}M</p>
                    <p className="text-xs text-slate-500">${prop.financials?.pricePerShare?.toLocaleString()}/share</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* KYC reminder */}
      {user?.kycStatus !== "verified" && (
        <div className="card p-5 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm font-semibold text-amber-400 mb-1">KYC Required for Tokenization</p>
          <p className="text-xs text-slate-500">
            Complete your identity verification to tokenize properties and enable trading.
            Contact the admin to submit your KYC documents.
          </p>
        </div>
      )}
    </div>
  );
}
