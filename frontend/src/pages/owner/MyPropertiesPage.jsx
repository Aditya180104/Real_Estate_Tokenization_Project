import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Building2, MapPin, ExternalLink, Zap } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";

const statusConfig = {
  active: "badge-green",
  pending_review: "badge-yellow",
  verified: "badge-blue",
  draft: "badge-gray",
  suspended: "badge-red",
  delisted: "badge-red",
};

export default function MyPropertiesPage() {
  const queryClient = useQueryClient();

  const { data: properties, isLoading } = useQuery({
    queryKey: ["owner-properties"],
    queryFn: async () => {
      const { data } = await api.get("/properties/owner/my-properties");
      return data.data;
    },
  });

  const handleTokenize = async (propertyId) => {
    const pricePerShareWei = prompt("Enter price per share in Wei (e.g. 1000000000000000 = 0.001 ETH):");
    if (!pricePerShareWei) return;

    try {
      toast.loading("Tokenizing property...", { id: "tokenize" });
      await api.post(`/properties/${propertyId}/tokenize`, { pricePerShareWei });
      toast.success("Property tokenized successfully!", { id: "tokenize" });
      queryClient.invalidateQueries(["owner-properties"]);
    } catch {
      toast.error("Tokenization failed", { id: "tokenize" });
    }
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">My Properties</h1>
          <p className="text-slate-500 mt-1 text-sm">{properties?.length || 0} properties listed</p>
        </div>
        <Link to="/owner/add-property" className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add Property
        </Link>
      </div>

      {properties?.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Add your first property to start the tokenization process."
          action={
            <Link to="/owner/add-property" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Property
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {properties.map((prop) => (
            <div key={prop._id} className="card p-6">
              <div className="flex items-start gap-4">
                {/* Image */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                  {prop.images?.[0] ? (
                    <img src={prop.images[0].url} alt="" className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200"; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-slate-100 text-lg">{prop.title}</h3>
                    <span className={statusConfig[prop.status] || "badge-gray"}>
                      {prop.status?.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    {prop.location?.address}, {prop.location?.city}, {prop.location?.country}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Total Value</p>
                      <p className="text-sm font-bold text-slate-100">${(prop.financials?.totalValue / 1000000).toFixed(2)}M</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Total Shares</p>
                      <p className="text-sm font-bold text-slate-100">{prop.financials?.totalShares?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Price/Share</p>
                      <p className="text-sm font-bold text-slate-100">${prop.financials?.pricePerShare?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Annual Return</p>
                      <p className="text-sm font-bold text-emerald-400">{prop.financials?.expectedAnnualReturn}%</p>
                    </div>
                  </div>

                  {/* Token info */}
                  {prop.tokenization?.isTokenized && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400 mb-3">
                      <Zap className="w-3.5 h-3.5" />
                      Tokenized · {prop.tokenization.tokenSymbol} ·{" "}
                      <a
                        href={`https://sepolia.etherscan.io/address/${prop.tokenization.contractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:text-emerald-300"
                      >
                        {prop.tokenization.contractAddress?.slice(0, 10)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Link to={`/marketplace/${prop._id}`} className="btn-secondary text-xs py-1.5 px-3">
                      View Listing
                    </Link>
                    {prop.status === "verified" && !prop.tokenization?.isTokenized && (
                      <button
                        onClick={() => handleTokenize(prop._id)}
                        className="btn-gold text-xs py-1.5 px-3 flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        Tokenize Now
                      </button>
                    )}
                    {prop.status === "draft" && (
                      <Link to={`/owner/edit-property/${prop._id}`} className="btn-secondary text-xs py-1.5 px-3">
                        Edit
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
