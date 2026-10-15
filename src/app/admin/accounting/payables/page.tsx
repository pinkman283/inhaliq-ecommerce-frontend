"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  ArrowLeft,
  X,
  Building2,
  Calendar,
  Wallet,
  Download,
  AlertTriangle,
} from "lucide-react";
import { AdminPageHeader, AdminEmptyState } from "@/components/admin/ui";
import { adminApi } from "@/lib/adminApi";
import { AccountingPayablesResponse, BankAccountItem } from "@/types";
import { PayablesAgingChart } from "@/components/admin/accounting";

export default function PayablesPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountingPayablesResponse | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccountItem[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"dues" | "vouchers">("dues");

  // Payment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayable, setSelectedPayable] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [bankAccountId, setBankAccountId] = useState<number | "">("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchPayables();
    fetchBankAccounts();
  }, []);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchPayables = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAccountingPayables();
      setData(res);
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to load payables.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const res = await adminApi.getAccountingBanking();
      setBankAccounts(res.accounts || []);
      if (res.accounts && res.accounts.length > 0) {
        setBankAccountId(res.accounts[0].id);
      }
    } catch {
      // Non-blocking
    }
  };

  const handleOpenPaymentModal = (payable: any) => {
    setSelectedPayable(payable);
    setAmount(payable.due_amount.toString());
    setReferenceNumber(`SPAY-${Date.now().toString().slice(-6)}`);
    setNotes(`Supplier settlement for GRN #${payable.receipt_number} (${payable.vendor_name})`);
    setModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayable) return;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast("error", "Please enter a valid disbursement amount.");
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.recordSupplierPayment({
        vendor_id: selectedPayable.vendor_id,
        purchase_order_id: selectedPayable.purchase_order_id,
        amount: numAmount,
        payment_method: paymentMethod,
        bank_account_id: bankAccountId ? Number(bankAccountId) : undefined,
        payment_date: paymentDate,
        reference_number: referenceNumber,
        notes,
      });

      showToast("success", `Disbursement of $${numAmount.toFixed(2)} to ${selectedPayable.vendor_name} posted.`);
      setModalOpen(false);
      fetchPayables();
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to record disbursement.");
    } finally {
      setSubmitting(false);
    }
  };

  const aging = data?.aging;
  const summary = data?.summary;
  const filteredPayables = (data?.payables || []).filter((p) => {
    const q = search.toLowerCase();
    return (
      p.receipt_number.toLowerCase().includes(q) ||
      (p.po_number && p.po_number.toLowerCase().includes(q)) ||
      (p.vendor_name && p.vendor_name.toLowerCase().includes(q))
    );
  });

  const totalDue = aging?.total ?? 0;
  const overdueAmount = (aging?.days_31_60 ?? 0) + (aging?.days_61_90 ?? 0) + (aging?.days_90_plus ?? 0);

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
        title="Accounts Payable & Supplier Dues"
        description="Audit unpaid procurement receipts, supplier aging brackets, and record commercial bank wire and cash disbursements."
        badge={filteredPayables.length > 0 ? `${filteredPayables.length} Open Bills` : undefined}
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
              onClick={fetchPayables}
              disabled={loading}
              className="p-1.5 rounded-md border border-white/[0.08] bg-[#0f121b] text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#A78BFA]" : ""}`} />
            </button>
            <a
              href={adminApi.getAccountingExportUrl("payables")}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] transition-colors text-xs font-semibold shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export A/P</span>
            </a>
          </div>
        }
      />

      {/* Compact Operational Insight Banner: High-density Metrics & Aging Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Key Operational Numbers */}
        <div className="lg:col-span-5 grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Open Payables
            </span>
            <div className="text-xl font-black text-white font-mono my-0.5">
              ${totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-400 font-mono">
              {filteredPayables.length} Open Bills
            </span>
          </div>

          <div
            className={`p-3.5 rounded-md border shadow-sm flex flex-col justify-between ${
              overdueAmount > 0
                ? "bg-rose-950/20 border-rose-500/30"
                : "bg-[#0f121b] border-white/[0.08]"
            }`}
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Overdue (31+d)
            </span>
            <div
              className={`text-xl font-black font-mono my-0.5 ${
                overdueAmount > 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              ${overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {totalDue > 0 ? `${((overdueAmount / totalDue) * 100).toFixed(0)}% overdue` : "0% overdue"}
            </span>
          </div>

          <div className="p-3.5 rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Disbursed
            </span>
            <div className="text-xl font-black text-purple-300 font-mono my-0.5">
              {summary ? `${summary.disbursement_rate_percent}%` : "—"}
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {data?.recent_payments?.length ?? 0} Payments
            </span>
          </div>
        </div>

        {/* Compact Aging Distribution Visualizer */}
        <div className="lg:col-span-7">
          <PayablesAgingChart
            aging={aging}
            summary={summary}
            isLoading={loading}
            compact={true}
          />
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 p-1 rounded-md bg-[#0f121b] border border-white/[0.08]">
          <button
            onClick={() => setActiveTab("dues")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "dues"
                ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Unsettled Supplier Bills ({filteredPayables.length})
          </button>
          <button
            onClick={() => setActiveTab("vouchers")}
            className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "vouchers"
                ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Payment Vouchers ({data?.recent_payments?.length ?? 0})
          </button>
        </div>

        {activeTab === "dues" && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by GRN #, PO #, vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f121b] border border-white/[0.08] rounded-md pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50"
            />
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === "dues" ? (
        <div className="p-5 rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm">
          {filteredPayables.length === 0 ? (
            <AdminEmptyState
              icon={CheckCircle2}
              title="All Supplier Bills Reconciled"
              description="All supplier shipments are fully paid and reconciled. No outstanding A/P balance!"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">GRN Receipt #</th>
                    <th className="pb-3 font-semibold">Purchase Order #</th>
                    <th className="pb-3 font-semibold">Supplier / Vendor</th>
                    <th className="pb-3 font-semibold">Receipt Date</th>
                    <th className="pb-3 font-semibold">Age Bracket</th>
                    <th className="pb-3 font-semibold text-right">Invoiced Total</th>
                    <th className="pb-3 font-semibold text-right">Paid</th>
                    <th className="pb-3 font-semibold text-right text-amber-400">Balance Due</th>
                    <th className="pb-3 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPayables.map((payable) => (
                    <tr key={payable.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono font-bold text-cyan-400">
                        {payable.receipt_number}
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {payable.po_number || "Direct Inflow"}
                      </td>
                      <td className="py-3 font-semibold text-white">
                        {payable.vendor_name || "General Supplier"}
                      </td>
                      <td className="py-3 font-mono text-slate-300">{payable.received_date}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            payable.days_open <= 30
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : payable.days_open <= 60
                              ? "bg-[#211B32] text-[#A78BFA] border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {payable.days_open} days open
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-slate-300 font-medium">
                        ${payable.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right font-mono text-emerald-400">
                        ${payable.paid_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-amber-300 text-sm">
                        ${payable.due_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleOpenPaymentModal(payable)}
                          className="px-3 py-1 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] text-xs font-semibold transition-all"
                        >
                          Settle Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="p-5 rounded-md bg-[#0f121b] border border-white/[0.08] shadow-sm">
          {(!data?.recent_payments || data.recent_payments.length === 0) ? (
            <AdminEmptyState
              icon={Building2}
              title="No Supplier Disbursements"
              description="Vendor disbursements and bank voucher settlements will appear here once processed."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Voucher #</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Vendor</th>
                    <th className="pb-3 font-semibold">PO #</th>
                    <th className="pb-3 font-semibold">Method</th>
                    <th className="pb-3 font-semibold">Disbursed From</th>
                    <th className="pb-3 font-semibold text-right">Amount ($)</th>
                    <th className="pb-3 font-semibold">Ref / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.recent_payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-mono font-bold text-[#A78BFA]">{p.payment_number}</td>
                      <td className="py-3 font-mono text-slate-300">{p.payment_date}</td>
                      <td className="py-3 font-semibold text-white">{p.vendor?.name || "Supplier"}</td>
                      <td className="py-3 font-mono text-slate-400">{p.purchase_order?.po_number || "—"}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-slate-300">
                          {p.payment_method}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-medium">
                        {p.bank_account?.account_name || "Primary Commercial Bank"}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-amber-300 text-sm">
                        ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-slate-400 max-w-xs truncate">
                        {p.reference_number ? `Ref: ${p.reference_number}` : p.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settle Payable Modal */}
      {modalOpen && selectedPayable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0f121b] border border-white/[0.08] rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Disburse Supplier Payment</h3>
                  <p className="text-[11px] text-slate-400 font-mono">GRN #{selectedPayable.receipt_number}</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="p-3 rounded-md bg-[#161a26] border border-white/[0.08] flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400">Supplier</div>
                  <div className="text-sm font-semibold text-white">{selectedPayable.vendor_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Outstanding Bill</div>
                  <div className="text-sm font-mono font-bold text-amber-400">
                    ${selectedPayable.due_amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Disbursement Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedPayable.due_amount}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#A78BFA]/50 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                  >
                    <option value="bank_transfer">Bank Wire Transfer</option>
                    <option value="cheque">Company Cheque</option>
                    <option value="cash">Petty Cash</option>
                    <option value="bkash">bKash MFS</option>
                    <option value="nagad">Nagad MFS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Disbursing Account</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(Number(e.target.value))}
                    className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                  >
                    {bankAccounts.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.account_name} (${b.current_balance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Voucher / Bank Ref #</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#A78BFA]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Disbursement Memo / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#161a26] border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[#A78BFA]/50 resize-none"
                  placeholder="Wire reference, cheque number, or vendor note..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.08]">
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
                  className="px-4 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Posting..." : "Confirm & Disburse Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
