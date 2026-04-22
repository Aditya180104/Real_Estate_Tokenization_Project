import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, ExternalLink, ArrowUpRight, ArrowDownLeft, Gift } from "lucide-react";
import api from "../../services/api";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";

const txConfig = {
  purchase: { label: "Purchase", icon: ArrowDownLeft, color: "text-emerald-400", bg: "bg-emerald-500/10", sign: "+" },
  sale: { label: "Sale", icon: ArrowUpRight, color: "text-red-400", bg: "bg-red-500/10", sign: "-" },
  revenue_distribution: { label: "Revenue", icon: Gift, color: "text-gold-400", bg: "bg-gold-500/10", sign: "+" },
  revenue_claim: { label: "Claimed", icon: Gift, color: "text-gold-400", bg: "bg-gold-500/10", sign: "+" },
};

export default function TransactionHistoryPage() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["my-transactions", page, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20, ...(typeFilter && { type: typeFilter }) });
      const { data } = await api.get(`/transactions/my-transactions?${params}`);
      return data;
    },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transaction History</h1>
          <p className="text-slate-500 mt-1 text-sm">All your investment activity</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "", label: "All" },
          { value: "purchase", label: "Purchases" },
          { value: "sale", label: "Sales" },
          { value: "revenue_distribution", label: "Revenue" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setTypeFilter(value); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              typeFilter === value
                ? "bg-primary-600 text-white"
                : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {data?.data?.length === 0 ? (
        <EmptyState
          icon={History}
          title="No transactions yet"
          description="Your transaction history will appear here once you start investing."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">Type</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">Property</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">Shares</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">Amount</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">Date</th>
                  <th className="text-left text-xs font-medium text-slate-500 px-6 py-4">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((tx) => {
                  const cfg = txConfig[tx.transactionType] || txConfig.purchase;
                  const Icon = cfg.icon;
                  return (
                    <tr key={tx._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                            <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                          </div>
                          <span className="text-sm text-slate-300">{cfg.label}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-300 max-w-[160px] truncate">
                          {tx.property?.title || "—"}
                        </p>
                        <p className="text-xs text-slate-600">{tx.property?.location?.city}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{tx.shares || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${cfg.color}`}>
                          {cfg.sign}${tx.amountUSD?.toLocaleString() || "0"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${tx.status === "confirmed" ? "badge-green" : tx.status === "pending" ? "badge-yellow" : "badge-red"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {tx.txHash ? (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-mono"
                          >
                            {tx.txHash.slice(0, 8)}...
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} pages={data?.pagination?.pages || 1} onPageChange={setPage} />
    </div>
  );
}
