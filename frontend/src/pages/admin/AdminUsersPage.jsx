import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Search, ShieldCheck, ShieldX, UserCheck, UserX, Plus } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import Pagination from "../../components/ui/Pagination";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [kycFilter, setKycFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [kycModal, setKycModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", firstName: "", lastName: "", role: "investor" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", page, search, roleFilter, kycFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20, ...(search && { search }), ...(roleFilter && { role: roleFilter }), ...(kycFilter && { kycStatus: kycFilter }) });
      const { data } = await api.get(`/admin/users?${params}`);
      return data;
    },
  });

  const handleKYC = async (status) => {
    try {
      await api.put(`/admin/users/${selectedUser._id}/kyc`, { kycStatus: status });
      toast.success(`KYC ${status} for ${selectedUser.firstName}`);
      queryClient.invalidateQueries(["admin-users"]);
      setKycModal(false);
    } catch {}
  };

  const handleToggleStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? "deactivated" : "activated"}`);
      queryClient.invalidateQueries(["admin-users"]);
    } catch {}
  };

  const handleAddUser = async () => {
    try {
      await api.post("/admin/users", newUser);
      toast.success("User created successfully");
      queryClient.invalidateQueries(["admin-users"]);
      setAddModal(false);
      setNewUser({ email: "", password: "", firstName: "", lastName: "", role: "investor" });
    } catch {}
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
          <p className="text-slate-500 mt-1 text-sm">{data?.pagination?.total || 0} total users</p>
        </div>
        <button onClick={() => setAddModal(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..." className="input-field pl-10 py-2 text-sm" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="input-field py-2 text-sm w-auto">
          <option value="">All Roles</option>
          <option value="investor">Investor</option>
          <option value="property_owner">Property Owner</option>
          <option value="admin">Admin</option>
        </select>
        <select value={kycFilter} onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
          className="input-field py-2 text-sm w-auto">
          <option value="">All KYC</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {["User", "Role", "KYC Status", "Wallet", "Joined", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-medium text-slate-500 px-6 py-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((user) => (
                <tr key={user._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-300">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge capitalize ${user.role === "admin" ? "badge-red" : user.role === "property_owner" ? "badge-blue" : "badge-green"}`}>
                      {user.role?.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.kycStatus === "verified" ? "badge-green" : user.kycStatus === "rejected" ? "badge-red" : "badge-yellow"}`}>
                      {user.kycStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.walletAddress ? (
                      <span className="text-xs font-mono text-slate-400">{user.walletAddress.slice(0, 10)}...</span>
                    ) : (
                      <span className="text-xs text-slate-600">Not connected</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.isActive ? "badge-green" : "badge-red"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setSelectedUser(user); setKycModal(true); }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-primary-400 transition-all"
                        title="Manage KYC"
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all ${user.isActive ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"}`}
                        title={user.isActive ? "Deactivate" : "Activate"}
                      >
                        {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
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

      {/* KYC Modal */}
      <Modal isOpen={kycModal} onClose={() => setKycModal(false)} title="Manage KYC Verification" size="sm">
        {selectedUser && (
          <div className="space-y-4">
            <div className="card p-4">
              <p className="text-sm font-semibold text-slate-300">{selectedUser.firstName} {selectedUser.lastName}</p>
              <p className="text-xs text-slate-500">{selectedUser.email}</p>
              <p className="text-xs text-slate-500 mt-1">Current status: <span className="text-amber-400">{selectedUser.kycStatus}</span></p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleKYC("verified")} className="flex-1 btn-primary flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Approve KYC
              </button>
              <button onClick={() => handleKYC("rejected")} className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2">
                <ShieldX className="w-4 h-4" />
                Reject KYC
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="Add New User" size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name</label>
              <input type="text" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                className="input-field" placeholder="John" />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                className="input-field" placeholder="Smith" />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="input-field" placeholder="user@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="input-field" placeholder="Min. 6 characters" />
          </div>
          <div>
            <label className="label">Role</label>
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="input-field">
              <option value="investor">Investor</option>
              <option value="property_owner">Property Owner</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAddUser} className="btn-primary flex-1">Create User</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
