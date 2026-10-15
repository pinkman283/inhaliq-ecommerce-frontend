"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Wallet, 
  DollarSign, 
  Building2, 
  ArrowRightLeft, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  X,
  CreditCard,
  Smartphone,
  Layers,
  ArrowDownLeft,
  ArrowUpRight
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { AccountingBankingResponse, BankAccountItem } from "@/types";

import { AdminPageHeader, AdminStatStrip, AdminEmptyState } from "@/components/admin/ui";

export default function BankingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountingBankingResponse | null>(null);

  // Transfer Modal State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [toAccountId, setToAccountId] = useState<number | "">("");
  const [amount, setAmount] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchBanking();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchBanking = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAccountingBanking();
      setData(res);
      if (res.accounts && res.accounts.length >= 2) {
        setFromAccountId(res.accounts[0].id);
        setToAccountId(res.accounts[1].id);
      }
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load banking accounts.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      showToast("error", "Source and destination accounts must be different.");
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("error", "Please enter a valid transfer amount.");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.createBankTransfer({
        from_bank_account_id: Number(fromAccountId),
        to_bank_account_id: Number(toAccountId),
        amount: numAmount,
        reference_number: referenceNumber || `TRF-${Date.now().toString().slice(-6)}`,
        notes,
      });

      showToast("success", `Successfully transferred $${numAmount.toFixed(2)} between accounts.`);
      setTransferModalOpen(false);
      setAmount("");
      setReferenceNumber("");
      setNotes("");
      fetchBanking();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const accounts = data?.accounts || [];
  const summary = data?.summary;
  const fromAccountObj = accounts.find((a) => a.id === fromAccountId);

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

      {/* Header */}
      <AdminPageHeader
        title="Liquid Cash & Bank Accounts"
        description="Real-time liquid cash, commercial bank reserves, mobile wallets, and internal double-entry fund transfers."
        badge={accounts.length > 0 ? `${accounts.length} Active Accounts` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/accounting"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-white/[0.08] bg-[#0f121b] text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Accounting Hub</span>
            </Link>
            <button
              onClick={() => setTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Internal Transfer</span>
            </button>
            <button
              onClick={fetchBanking}
              disabled={loading}
              className="p-1.5 rounded-md border border-white/[0.08] bg-[#0f121b] text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
            </button>
          </div>
        }
      />

      {/* Liquidity Summary Cards */}
      <AdminStatStrip
        stats={[
          {
            label: "Total Liquidity",
            value: `$${(summary?.total_liquidity ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: Wallet,
            change: "Cash + Banks + MFS",
            changeType: "neutral",
          },
          {
            label: "Physical Cash",
            value: `$${(summary?.total_cash ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            change: "Drawers & Petty Cash",
            changeType: "neutral",
          },
          {
            label: "Commercial Banks",
            value: `$${(summary?.total_bank ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: Building2,
            change: "Corporate Wire Accounts",
            changeType: "neutral",
          },
          {
            label: "Digital Wallets",
            value: `$${(summary?.total_mfs ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            icon: Smartphone,
            change: "bKash, Nagad & Gateways",
            changeType: "neutral",
          },
        ]}
      />

      {/* Account Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const isCash = account.account_type === "cash";
          const isBank = account.account_type === "bank";
          return (
            <div
              key={account.id}
              className="p-5 rounded-md bg-[#0f121b] border border-white/[0.08] flex flex-col justify-between gap-4 relative overflow-hidden group hover:border-purple-500/30 transition-all shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-md bg-[#161a26] border border-white/[0.08] flex items-center justify-center text-purple-400">
                    {isCash ? <DollarSign className="w-5 h-5 text-[#A78BFA]" /> :
                     isBank ? <Building2 className="w-5 h-5 text-blue-400" /> :
                     <Smartphone className="w-5 h-5 text-rose-400" />}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isCash ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30" :
                    isBank ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                    "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}>
                    {account.account_type}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-base font-bold text-white">{account.account_name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {account.bank_name ? `${account.bank_name} • ${account.branch_name || 'Main'}` : 'Physical Till / Petty Drawer'}
                  </p>
                  {account.account_number && (
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Acc: {account.account_number}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">Reconciled Balance</span>
                  <span className="text-xl font-black text-purple-300 font-mono">
                    ${account.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setFromAccountId(account.id);
                    setTransferModalOpen(true);
                  }}
                  className="px-2.5 py-1 rounded-md bg-[#161a26] hover:bg-white/10 text-[11px] font-semibold text-slate-300 transition-colors border border-white/[0.08]"
                >
                  Transfer Funds
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Cash & Bank Transactions Register */}
      <div className="p-5 rounded-md bg-[#0f121b] border border-white/[0.08] space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Cash & Bank Movements Register
            </h2>
            <p className="text-xs text-slate-400">Double-entry debits (deposits/receipts) and credits (disbursements/withdrawals)</p>
          </div>
        </div>

        {(!data?.recent_transactions || data.recent_transactions.length === 0) ? (
          <AdminEmptyState
            icon={Layers}
            title="No Movements Recorded"
            description="Recent cash receipts, bank settlements, and transfer ledger logs will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Entry #</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Account</th>
                  <th className="pb-3 font-semibold">Narration / Memo</th>
                  <th className="pb-3 font-semibold text-right">Inflow / Debit ($)</th>
                  <th className="pb-3 font-semibold text-right">Outflow / Credit ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recent_transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-mono font-bold text-[#A78BFA]">
                      {tx.journalEntry?.entry_number || tx.journal_entry?.entry_number || `#${tx.journal_entry_id}`}
                    </td>
                    <td className="py-2.5 font-mono text-slate-300">{tx.journalEntry?.entry_date || tx.journal_entry?.entry_date || "—"}</td>
                    <td className="py-2.5 font-medium text-white">
                      [{tx.account?.account_code}] {tx.account?.account_name}
                    </td>
                    <td className="py-2.5 text-slate-300 max-w-sm truncate">
                      {tx.memo || tx.journalEntry?.narration || tx.journal_entry?.narration || "—"}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                      {tx.debit > 0 ? `+$${tx.debit.toFixed(2)}` : "—"}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-rose-400">
                      {tx.credit > 0 ? `-$${tx.credit.toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Internal Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f121b] border border-white/[0.08] rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Internal Fund Transfer</h3>
                  <p className="text-[11px] text-slate-400">Move funds between business accounts</p>
                </div>
              </div>
              <button
                onClick={() => setTransferModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Source Account (From)</label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(Number(e.target.value))}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} (Available: ${a.current_balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination Account (To)</label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(Number(e.target.value))}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.account_name} (${a.current_balance.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-purple-400 font-bold"
                  required
                />
                {fromAccountObj && parseFloat(amount) > fromAccountObj.current_balance && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Amount exceeds source account balance (${fromAccountObj.current_balance.toFixed(2)}).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reference Number</label>
                <input
                  type="text"
                  placeholder="e.g. WIRE-8819 or Cash Deposit Slip"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Memo / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Reason for fund movement..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Transferring..." : "Execute Transfer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
