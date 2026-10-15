"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ListTree, 
  Search, 
  Plus, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  X,
  Layers
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { ChartOfAccountItem, AccountType } from "@/types";
import { AdminPageHeader, AdminEmptyState } from "@/components/admin/ui";

export default function ChartOfAccountsPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<ChartOfAccountItem[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("expense");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [filterType]);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getChartOfAccounts({
        account_type: filterType !== "all" ? filterType : undefined,
      });
      setAccounts(res.accounts || []);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load Chart of Accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountCode || !accountName) {
      showToast("error", "Account code and name are required.");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createChartOfAccount({
        account_code: accountCode.trim(),
        account_name: accountName.trim(),
        account_type: accountType,
        description: description.trim() || undefined,
      });

      showToast("success", `Account [${accountCode}] ${accountName} created.`);
      setModalOpen(false);
      setAccountCode("");
      setAccountName("");
      setDescription("");
      fetchAccounts();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to create account.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAccounts = accounts.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.account_code.toLowerCase().includes(q) ||
      a.account_name.toLowerCase().includes(q) ||
      (a.description && a.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-md shadow-2xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-300 ${
            toast.type === "success"
              ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
              : "bg-rose-950/90 text-rose-200 border-rose-500/40"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.text}</span>
        </div>
      )}

      {/* Admin Page Header */}
      <AdminPageHeader
        title="Chart of Accounts (COA)"
        description="Standard 6-class accounting structure: Assets (1000), Liabilities (2000), Equity (3000), Revenue (4000), COGS (5000), Expenses (6000)."
        badge="Double-Entry GAAP"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-semibold transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Sub-Account</span>
            </button>
            <button
              onClick={fetchAccounts}
              disabled={loading}
              className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/[0.08] text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#A78BFA]" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Class Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Classes" },
            { id: "asset", label: "1. Assets" },
            { id: "liability", label: "2. Liabilities" },
            { id: "equity", label: "3. Equity" },
            { id: "revenue", label: "4. Revenue" },
            { id: "cogs", label: "5. COGS" },
            { id: "expense", label: "6. Expenses" },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                filterType === type.id
                  ? "bg-[#A78BFA] text-[#090B10] font-bold shadow-sm"
                  : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search code or account name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#161a26] border border-white/[0.08] rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 transition"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="p-4 rounded-md bg-[#0f121b] border border-white/[0.08] space-y-3 shadow-sm">
        {filteredAccounts.length === 0 ? (
          <AdminEmptyState
            icon={ListTree}
            title="No accounts found"
            description="No accounts match your current search query or class filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Account Code</th>
                  <th className="pb-3 font-semibold">Account Name</th>
                  <th className="pb-3 font-semibold">Classification</th>
                  <th className="pb-3 font-semibold text-center">Normal Balance</th>
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold text-right">Current Balance</th>
                  <th className="pb-3 font-semibold text-center">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAccounts.map((account) => {
                  const isAsset = account.account_type === "asset";
                  const isLiab = account.account_type === "liability";
                  const isEq = account.account_type === "equity";
                  const isRev = account.account_type === "revenue";
                  const isCogs = account.account_type === "cogs";
                  const isExp = account.account_type === "expense";

                  return (
                    <tr key={account.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono font-bold text-[#A78BFA]">
                        {account.account_code}
                      </td>
                      <td className="py-3 font-bold text-white">
                        {account.account_name}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                          isAsset ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                          isLiab ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          isEq ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                          isRev ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          isCogs ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                          "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {account.account_type}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono text-slate-300">
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 border border-white/10">
                          {account.normal_balance}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400 max-w-xs truncate text-[11px]">
                        {account.description || "—"}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-slate-200 text-sm">
                        ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        {account.is_system ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-500">
                            <Lock className="w-3 h-3" /> System
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                            Custom
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b0f19] border border-white/10 rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ListTree className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add Custom Account</h3>
                  <p className="text-[11px] text-slate-400">Create a new sub-account in General Ledger</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Account Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 6080"
                    value={accountCode}
                    onChange={(e) => setAccountCode(e.target.value)}
                    className="w-full bg-[#141a29] border border-white/10 rounded-md px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Classification</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as AccountType)}
                    className="w-full bg-[#141a29] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="asset">Asset (1000)</option>
                    <option value="liability">Liability (2000)</option>
                    <option value="equity">Equity (3000)</option>
                    <option value="revenue">Revenue (4000)</option>
                    <option value="cogs">COGS (5000)</option>
                    <option value="expense">Expense (6000)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Account Name</label>
                <input
                  type="text"
                  placeholder="e.g. Server Infrastructure & CDN"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-[#141a29] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="What transactions are posted to this account..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141a29] border border-white/10 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20"
                >
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
