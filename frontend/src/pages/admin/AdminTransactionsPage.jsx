import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, ExternalLink } from "lucide-react";
import api from "../../services/api";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import EmptyState from "../../components/ui/EmptyState";

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-transactions", page],
    queryFn: async () => {
      const { data } = await api.get(`/admin/transactions?page=${page}&limit=20`);
      return data;
    },
  });

  if (isLoading) return <PageLoader />;

  const txTypeConfig = {
    purchase: { label: "Purchase", color: "badge-green" },
    sale: { label: "Sale", color: "badge-red" },
    revenue_distribution: { label: "Revenue Dist.", color: "badge-blue" },
    revenue_claim: { label: "Revenue Claim", color: "badge-gold" },
    transfer: { label: "Transfer", color: "badge-gray" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Transaction Log</h1>
        <p className="text-slate-500 mt-1 text-sm">{data?.pagination?.total || 0} total transactions</p>
      </div>

      {data?.data?.length === 0 ? (
        <EmptyState icon={Activity} title="No transactions yet" description="Transactions will appear here once users start trading." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {["Type", "Property", "From", "To", "Shares", "Amount", "Status", "Date", "Tx Hash"].map((h) => (
                    <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((tx) => {
                  const cfg = txTypeConfig[tx.transactionType] || txTypeConfig.transfer;
                  return (
                    <tr key={tx._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className={cfg.color}>{cfg.label}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-300 max-w-[140px] truncate">{tx.property?.title || "—"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-400">{tx.fromUser?.firstName} {tx.fromUser?.lastName}</p>
                        <p className="text-xs text-slate-600 font-mono">{tx.fromAddress?.slice(0, 8)}...</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs text-slate-400">{tx.toUser?.firstName} {tx.toUser?.lastName}</p>
                        <p className="text-xs text-slate-600 font-mono">{tx.toAddress?.slice(0, 8)}...</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">{tx.shares || "—"}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-300">
                        ${tx.amountUSD?.toLocaleString() || "0"}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`badge ${tx.status === "confirmed" ? "badge-green" : tx.status === "pending" ? "badge-yellow" : "badge-red"}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        {tx.txHash ? (
                          <a href={`https://sepolia.etherscan.io/tx/${tx.txHash}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300 font-mono">
                            {tx.txHash.slice(0, 8)}...
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : <span className="text-slate-600 text-xs">—</span>}
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
