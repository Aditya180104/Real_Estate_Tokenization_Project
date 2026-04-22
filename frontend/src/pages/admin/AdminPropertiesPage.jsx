import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CheckCircle, XCircle, Star, StarOff, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";

export default function AdminPropertiesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-properties", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20, ...(statusFilter && { status: statusFilter }) });
      const { data } = await api.get(`/admin/properties?${params}`);
      return data;
    },
  });

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/properties/${id}/verify`);
      toast.success("Property verified successfully");
      queryClient.invalidateQueries(["admin-properties"]);
    } catch {}
  };

  const handleReject = async () => {
    try {
      await api.put(`/admin/properties/${selectedProperty._id}/reject`, { rejectionReason });
      toast.success("Property rejected");
      queryClient.invalidateQueries(["admin-properties"]);
      setRejectModal(false);
      setRejectionReason("");
    } catch {}
  };

  const handleFeature = async (id, featured) => {
    try {
      await api.put(`/admin/properties/${id}/feature`, { featured: !featured });
      toast.success(featured ? "Removed from featured" : "Added to featured");
      queryClient.invalidateQueries(["admin-properties"]);
    } catch {}
  };

  if (isLoading) return <PageLoader />;

  const statusConfig = {
    active: "badge-green",
    pending_review: "badge-yellow",
    verified: "badge-blue",
    draft: "badge-gray",
    suspended: "badge-red",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Property Management</h1>
        <p className="text-slate-500 mt-1 text-sm">{data?.pagination?.total || 0} total properties</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "", label: "All" },
          { value: "pending_review", label: "Pending Review" },
          { value: "verified", label: "Verified" },
          { value: "active", label: "Active" },
          { value: "suspended", label: "Suspended" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              statusFilter === value
                ? "bg-primary-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {["Property", "Owner", "Value", "Shares", "Status", "Tokenized", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((prop) => (
                <tr key={prop._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <p className="text-sm font-medium text-slate-300 max-w-[180px] truncate">{prop.title}</p>
                        <p className="text-xs text-slate-500">{prop.location?.city}, {prop.location?.country}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-400">{prop.owner?.firstName} {prop.owner?.lastName}</p>
                    <p className="text-xs text-slate-600">{prop.owner?.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    ${(prop.financials?.totalValue / 1000000).toFixed(2)}M
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {prop.financials?.totalShares?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={statusConfig[prop.status] || "badge-gray"}>
                      {prop.status?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={prop.tokenization?.isTokenized ? "badge-green" : "badge-gray"}>
                      {prop.tokenization?.isTokenized ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Link to={`/marketplace/${prop._id}`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-all"
                        title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {prop.status === "pending_review" && (
                        <>
                          <button onClick={() => handleVerify(prop._id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all"
                            title="Verify">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedProperty(prop); setRejectModal(true); }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all"
                            title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleFeature(prop._id, prop.featured)}
                        className={`p-1.5 rounded-lg bg-slate-800 hover:bg-gold-500/20 transition-all ${prop.featured ? "text-gold-400" : "text-slate-400 hover:text-gold-400"}`}
                        title={prop.featured ? "Remove from featured" : "Feature"}>
                        {prop.featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pages={data?.pagination?.pages || 1} onPageChange={setPage} />

      {/* Reject Modal */}
      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Property" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Rejecting: <span className="text-slate-200 font-medium">{selectedProperty?.title}</span>
          </p>
          <div>
            <label className="label">Rejection Reason *</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why this property is being rejected..."
              className="input-field min-h-[100px] resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRejectModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              Reject Property
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
