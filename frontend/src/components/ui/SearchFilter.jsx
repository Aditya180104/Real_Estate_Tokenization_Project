import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export default function SearchFilter({ onSearch, onFilter, filters = {} }) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    city: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    ...filters,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch?.(search);
  };

  const handleFilterChange = (key, value) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFilter?.(updated);
  };

  const clearFilters = () => {
    const reset = { propertyType: "", minPrice: "", maxPrice: "", city: "", sortBy: "createdAt", sortOrder: "desc" };
    setLocalFilters(reset);
    setSearch("");
    onFilter?.(reset);
    onSearch?.("");
  };

  const hasActiveFilters = Object.values(localFilters).some((v) => v && v !== "createdAt" && v !== "desc") || search;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search properties by name, city, or description..."
            className="input-field pl-10"
          />
        </div>
        <button type="submit" className="btn-primary px-5">Search</button>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-secondary flex items-center gap-2 ${showFilters ? "border-primary-500 text-primary-400" : ""}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary-500" />
          )}
        </button>
        {hasActiveFilters && (
          <button type="button" onClick={clearFilters} className="btn-secondary text-red-400 hover:text-red-300 px-3">
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Filter panel */}
      {showFilters && (
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in">
          <div>
            <label className="label">Type</label>
            <select
              value={localFilters.propertyType}
              onChange={(e) => handleFilterChange("propertyType", e.target.value)}
              className="input-field py-2 text-sm"
            >
              <option value="">All Types</option>
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
              <option value="land">Land</option>
              <option value="mixed_use">Mixed Use</option>
            </select>
          </div>
          <div>
            <label className="label">City</label>
            <input
              type="text"
              value={localFilters.city}
              onChange={(e) => handleFilterChange("city", e.target.value)}
              placeholder="Any city"
              className="input-field py-2 text-sm"
            />
          </div>
          <div>
            <label className="label">Min Price/Share</label>
            <input
              type="number"
              value={localFilters.minPrice}
              onChange={(e) => handleFilterChange("minPrice", e.target.value)}
              placeholder="$0"
              className="input-field py-2 text-sm"
            />
          </div>
          <div>
            <label className="label">Max Price/Share</label>
            <input
              type="number"
              value={localFilters.maxPrice}
              onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
              placeholder="No limit"
              className="input-field py-2 text-sm"
            />
          </div>
          <div>
            <label className="label">Sort By</label>
            <select
              value={localFilters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="input-field py-2 text-sm"
            >
              <option value="createdAt">Newest</option>
              <option value="financials.pricePerShare">Price</option>
              <option value="financials.expectedAnnualReturn">Return</option>
              <option value="financials.totalValue">Total Value</option>
            </select>
          </div>
          <div>
            <label className="label">Order</label>
            <select
              value={localFilters.sortOrder}
              onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
              className="input-field py-2 text-sm"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
