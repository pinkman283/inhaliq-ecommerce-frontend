"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  X,
  History,
  ShieldAlert,
  User as UserIcon,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { StoreCreditAccount, StoreCreditTransaction, User } from "@/types";
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminPagination,
} from "@/components/admin/ui";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { toast } from "sonner";

export default function StoreCreditPage() {
  const [activeTab, setActiveTab] = useState<"accounts" | "ledger">("accounts");
  const [accounts, setAccounts] = useState<StoreCreditAccount[]>([]);
  const [ledger, setLedger] = useState<StoreCreditTransaction[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");
  const [amount, setAmount] = useState<number>(500);
  const [adjustType, setAdjustType] = useState<"credit" | "debit">("credit");
  const [reason, setReason] = useState("Customer loyalty compensation");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "accounts") {
        const [accRes, custRes] = await Promise.all([
          adminApi.getStoreCreditAccounts({
            search: search || undefined,
            page,
            per_page: 20,
          }),
          adminApi.getCustomers({ per_page: 100 }),
        ]);
        setAccounts(accRes.data || []);
        setTotalPages(accRes.last_page || 1);
        setTotalCount(accRes.total || 0);
        setCustomers(custRes.data || []);
        if (custRes.data?.length > 0 && !selectedUserId) {
          setSelectedUserId(custRes.data[0].id);
        }
      } else {
        const ledRes = await adminApi.getStoreCreditLedger({
          search: search || undefined,
          page,
          per_page: 25,
        });
        setLedger(ledRes.data || []);
        setTotalPages(ledRes.last_page || 1);
        setTotalCount(ledRes.total || 0);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load store credit data");
    } finally {
      setLoading(false);
    }
  }, [activeTab, search, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdjustCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a customer");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!reason.trim()) {
      toast.error("Reason is required for audit trail");
      return;
    }

    setAdjusting(true);
    try {
      const res = await adminApi.adjustStoreCredit({
        user_id: Number(selectedUserId),
        amount: Number(amount),
        type: adjustType,
        reason,
      });

      toast.success(res.message || "Store credit adjusted successfully");
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to adjust store credit");
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <AdminPageHeader
        title="Store Credit & Customer Wallets"
        description="Auditable customer credit accounts, balance manual adjustments, compensation refunds, and double-entry general ledger tracking."
        badge="Financial Wallet"
        badgeVariant="cyan"
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Promotions & Discounts", href: "/admin/promotions" },
          { label: "Store Credit" },
        ]}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="p-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-purple-500/10 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adjust Store Credit
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-1 text-xs">
        <button
          type="button"
          onClick={() => {
            setActiveTab("accounts");
            setPage(1);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold transition-colors cursor-pointer ${
            activeTab === "accounts"
              ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Wallet className="w-4 h-4" />
          Customer Credit Accounts
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("ledger");
            setPage(1);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md font-bold transition-colors cursor-pointer ${
            activeTab === "ledger"
              ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          Transaction Audit Ledger
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-4 rounded-md border border-white/[0.06] bg-[#0c0e14] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder={
              activeTab === "accounts"
                ? "Search customer by name or email..."
                : "Search ledger by reason or user..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white placeholder-slate-500 focus:border-[#A78BFA]/50 outline-none"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Total Records: <strong className="text-white">{totalCount}</strong>
        </span>
      </div>

      {/* Tab 1: Customer Accounts Table */}
      {activeTab === "accounts" && (
        <ScrollableTableCard>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-4">Customer</th>
                <th className="p-4">Current Balance</th>
                <th className="p-4">Total Credited</th>
                <th className="p-4">Total Debited</th>
                <th className="p-4">Status</th>
                <th className="p-4">Last Activity</th>
                <th className="p-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading credit accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No store credit accounts found.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center font-bold text-cyan-400">
                          {acc.user?.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-bold text-white">{acc.user?.name || `User #${acc.user_id}`}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{acc.user?.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                        ৳{Number(acc.balance).toLocaleString()}
                      </span>
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono text-slate-300">
                      ৳{Number(acc.total_credited).toLocaleString()}
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono text-slate-300">
                      ৳{Number(acc.total_debited).toLocaleString()}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <AdminStatusBadge status={acc.is_frozen ? "paused" : "active"} />
                    </td>

                    <td className="p-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                      {new Date(acc.updated_at).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserId(acc.user_id);
                          setIsModalOpen(true);
                        }}
                        className="text-xs font-bold text-[#A78BFA] hover:text-[#B9A3FF] hover:underline cursor-pointer"
                      >
                        Adjust Balance
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollableTableCard>
      )}

      {/* Tab 2: Transaction Audit Ledger */}
      {activeTab === "ledger" && (
        <ScrollableTableCard>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 uppercase tracking-wider font-semibold">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Type</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Balance After</th>
                <th className="p-4">Reason / Memo</th>
                <th className="p-4 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-[#A78BFA] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading transaction ledger...
                  </td>
                </tr>
              ) : ledger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <History className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    No ledger transactions recorded yet.
                  </td>
                </tr>
              ) : (
                ledger.map((tx) => {
                  const isCredit = tx.type === "credit" || tx.type === "refund" || tx.type === "reward";
                  return (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 whitespace-nowrap font-mono text-slate-400 text-[11px]">
                        {new Date(tx.created_at).toLocaleString()}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-white">Customer #{tx.user_id}</div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                            isCredit
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {isCredit ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {tx.type}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap font-mono font-bold">
                        <span className={isCredit ? "text-emerald-400" : "text-rose-400"}>
                          {isCredit ? "+" : "-"}৳{Number(tx.amount).toLocaleString()}
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap font-mono text-white">
                        ৳{Number(tx.balance_after).toLocaleString()}
                      </td>

                      <td className="p-4 text-slate-300 max-w-sm truncate">
                        {tx.reason}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {tx.reference_type ? `${tx.reference_type} #${tx.reference_id}` : "Manual Entry"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </ScrollableTableCard>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={(p) => setPage(p)}
        />
      )}

      {/* Adjust Store Credit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e1017] border border-white/10 rounded-lg w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#A78BFA]" />
                Adjust Customer Store Credit
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustCredit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Target Customer</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Adjustment Type</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none"
                  >
                    <option value="credit">Credit (+) Add to Wallet</option>
                    <option value="debit">Debit (-) Deduct from Wallet</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Amount (৳)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white font-mono focus:border-[#A78BFA]/50 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Reason / Memo (Required for Audit)</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. VIP loyalty compensation, Order return compensation..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md bg-[#12151f] border border-white/10 text-xs text-white focus:border-[#A78BFA]/50 outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-md bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-cyan-300">
                <strong>Accounting Note:</strong> Crediting automatically debits account <code>4090 - Sales Discounts</code> and credits liability <code>2020 - Customer Advances & Store Credit</code>.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-md text-xs font-bold bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] shadow-lg shadow-purple-500/10 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {adjusting ? "Processing..." : "Confirm Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
