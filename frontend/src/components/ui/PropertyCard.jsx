import { Link } from "react-router-dom";
import { MapPin, TrendingUp, Users, Layers } from "lucide-react";

const statusConfig = {
  active: { label: "Active", className: "badge-green" },
  pending_review: { label: "Pending Review", className: "badge-yellow" },
  verified: { label: "Verified", className: "badge-blue" },
  suspended: { label: "Suspended", className: "badge-red" },
  draft: { label: "Draft", className: "badge-gray" },
};

export default function PropertyCard({ property, linkPrefix = "/properties" }) {
  const primaryImage = property.images?.find((i) => i.isPrimary) || property.images?.[0];
  const status = statusConfig[property.status] || statusConfig.draft;
  const availablePercent = property.financials?.totalShares > 0
    ? Math.round((property.financials.totalShares / property.financials.totalShares) * 100)
    : 100;

  return (
    <Link to={`${linkPrefix}/${property._id}`} className="block">
      <div className="card-hover overflow-hidden group">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-slate-800">
          {primaryImage ? (
            <img
              src={primaryImage.url}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className={status.className}>{status.label}</span>
          </div>
          {property.featured && (
            <div className="absolute top-3 right-3">
              <span className="badge bg-gold-500/20 text-gold-400 border border-gold-500/30">Featured</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-slate-100 text-sm leading-tight line-clamp-2 group-hover:text-primary-400 transition-colors">
              {property.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-xs mb-4">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {property.location?.city}, {property.location?.country}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-2.5">
              <p className="text-xs text-slate-500 mb-0.5">Price/Share</p>
              <p className="text-sm font-bold text-slate-100">
                ${property.financials?.pricePerShare?.toLocaleString()}
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-2.5">
              <p className="text-xs text-slate-500 mb-0.5">Annual Return</p>
              <p className="text-sm font-bold text-emerald-400">
                {property.financials?.expectedAnnualReturn}%
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3" />
              <span>{property.financials?.totalShares?.toLocaleString()} shares</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>${(property.financials?.totalValue / 1000000).toFixed(1)}M value</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
