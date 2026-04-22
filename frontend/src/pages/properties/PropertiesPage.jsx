import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import api from "../../services/api";
import PropertyCard from "../../components/ui/PropertyCard";
import SearchFilter from "../../components/ui/SearchFilter";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";

export default function PropertiesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["properties", page, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page,
        limit: 12,
        status: "active",
        ...(search && { search }),
        ...filters,
      });
      const { data } = await api.get(`/properties?${params}`);
      return data;
    },
  });

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleFilter = (f) => {
    setFilters(f);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Property Marketplace</h1>
        <p className="text-slate-400">Browse and invest in tokenized real estate properties</p>
      </div>

      <div className="mb-8">
        <SearchFilter onSearch={handleSearch} onFilter={handleFilter} />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : data?.data?.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties found"
          description="Try adjusting your search or filters to find properties."
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">
              {data?.pagination?.total || 0} properties found
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data?.data?.map((property) => (
              <PropertyCard key={property._id} property={property} />
            ))}
          </div>

          <Pagination
            page={page}
            pages={data?.pagination?.pages || 1}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
